/**
 * `ParkMap` — the canvas city map.
 *
 * A plain, framework-agnostic class ported from the map half of park-ing's
 * `src/proto.template.html`. Nothing in here is reactive: the render loop, the
 * LRU caches and the neighbour prefetch are imperative by nature and stay that
 * way. `CityMap.svelte` is a thin wrapper that drives this from an effect.
 *
 * Every browser API is touched from a method, never from module scope, so the
 * module is safe to import on the server (`adapter-static` prerenders the page).
 *
 * Rendering strategy, unchanged from the prototype:
 *   1. Fetch + delta-decode the city's geometry (LRU-cached, aborts on switch).
 *   2. Build one `Path2D` per layer, sliced across frames (`PathBuilder`).
 *   3. Rasterise the whole scene into an offscreen snapshot once per settled
 *      view, then blit that snapshot through the delta transform every frame —
 *      gesture frames cost O(blit) rather than O(scene).
 */

import type { StateKey } from '../state.svelte';
import { COLORS } from './colors';
import { decodeGeo, type DecodedGeo, type GeoJson, type UhiInfo } from './geometry';
import { PathBuilder, type BuiltPaths } from './path-builder';
import { ResourceCache } from './resource-cache';
import { MapView, covContains, tierFor } from './view';

/** A decoded heat-island raster. `ImageBitmap` everywhere modern; the
 *  `HTMLImageElement` branch is the fallback the prototype carried. */
type HeatImage = ImageBitmap | HTMLImageElement;

export interface ParkMapOptions {
	/** Loading / error message for the box over the canvas; null clears it. */
	onOverlay?: (msg: string | null) => void;
	/** The selected city's heat-island metadata, or null when it has none.
	 *  Fires on every city load — drives the Heat button and the legend. */
	onUhi?: (info: UhiInfo | null) => void;
	/** True while the view is zoomed in; drives the Reset button. */
	onZoom?: (zoomed: boolean) => void;
	/** The element gestures bind to. Defaults to the canvas; pass the wrapper
	 *  so pointer capture and focus land on the focusable element. */
	surface?: HTMLElement;
	/** Where `<slug>.json` and `<slug>.uhi.png` live. No trailing slash. */
	geoBase?: string;
}

const GEO_LRU = 6;
const UHI_LRU = 6;
/** Debounce for "the gesture stopped, rebuild sharp". */
const SETTLE_MS = 180;

export class ParkMap {
	readonly #canvas: HTMLCanvasElement;
	readonly #surface: HTMLElement;
	readonly #opts: ParkMapOptions;
	readonly #geoBase: string;

	readonly #geoCache: ResourceCache<DecodedGeo>;
	readonly #uhiCache: ResourceCache<HeatImage>;
	readonly #builder: PathBuilder;
	readonly #view = new MapView();

	#geo: DecodedGeo | null = null;
	#slug: string | null = null;
	#label = '';
	#loadToken = 0;
	#stateKey: StateKey = 'now';
	#heatOn = false;
	#neighbours: string[] = [];
	#destroyed = false;

	/** Committed layer paths (the prototype's `P2D`). */
	#paths: BuiltPaths | null = null;

	// --- offscreen snapshot -------------------------------------------------
	#snap: HTMLCanvasElement;
	#snapView: { geo: DecodedGeo; z: number; tx: number; ty: number; w: number; h: number } | null =
		null;
	#snapStamp = 0;

	// --- scheduling ---------------------------------------------------------
	#rafPending = false;
	#drawKey = '';
	#settleTimer: ReturnType<typeof setTimeout> | null = null;
	#resizeTimer: ReturnType<typeof setTimeout> | null = null;
	#idleHandle: number | null = null;
	#idleIsRic = false;
	#resizeObserver: ResizeObserver | null = null;

	// --- gesture state ------------------------------------------------------
	#boxRect: DOMRect | null = null;
	#ptrs = new Map<number, { x: number; y: number }>();
	#pinch: { d: number; mx: number; my: number } | null = null;

	constructor(canvas: HTMLCanvasElement, opts: ParkMapOptions = {}) {
		this.#canvas = canvas;
		this.#opts = opts;
		this.#surface = opts.surface ?? canvas;
		this.#geoBase = (opts.geoBase ?? '/posts/what-if-we-got-rid-of-cars/geo').replace(/\/$/, '');
		this.#snap = document.createElement('canvas');

		this.#geoCache = new ResourceCache<DecodedGeo>({
			limit: GEO_LRU,
			load: async (slug, signal) => {
				const res = await fetch(`${this.#geoBase}/${slug}.json`, { cache: 'no-cache', signal });
				if (!res.ok) throw new Error(String(res.status));
				return decodeGeo((await res.json()) as GeoJson);
			}
		});

		this.#uhiCache = new ResourceCache<HeatImage>({
			limit: UHI_LRU,
			load: (slug, signal) => this.#loadHeatImage(slug, signal),
			dispose: (img) => {
				if ('close' in img) img.close();
			}
		});

		this.#builder = new PathBuilder({
			stillValid: (geo) => geo === this.#geo,
			onProgress: (out) => {
				// First appearance is progressive: show finished layers while the
				// rest build. (Tier rebuilds keep showing the committed paths.)
				if (!this.#paths || this.#paths.geo !== this.#geo) {
					this.#renderScene(out);
					this.#scheduleDraw();
				}
			},
			onDone: (out) => {
				const t = tierFor(this.#view.z);
				if (!this.#buildMatches(out, t)) {
					// The view moved on while building (zoomed out of a culled
					// build, resized): drop the stale result and rebuild for where
					// the view is now.
					if (!this.#buildMatches(this.#paths, t)) {
						this.#startBuild(this.#view.w, this.#view.h, t);
					}
					return;
				}
				this.#paths = out;
				this.#renderScene(null);
				this.#scheduleDraw();
			}
		});

		this.#bindListeners();
	}

	// =========================================================================
	// public API
	// =========================================================================

	/**
	 * Select a city: fetch, decode and build its paths. Cached cities appear
	 * instantly; any older fetch (including prefetches) is aborted.
	 * `label` is only used for the "couldn't load" message.
	 */
	async setCity(slug: string, label?: string): Promise<void> {
		if (this.#destroyed) return;
		if (label !== undefined) this.#label = label;
		const token = ++this.#loadToken;

		this.#cancelPrefetch();
		this.#geoCache.abortOthers(slug);
		this.#uhiCache.abortOthers(slug);
		this.#slug = slug;
		this.#geoCache.keep = slug;
		this.#uhiCache.keep = slug;
		this.#resetView(true);

		const cached = this.#geoCache.peek(slug);
		if (cached) {
			this.#geoCache.touch(slug);
			this.#adoptGeo(cached);
			return;
		}

		this.#geo = null;
		this.#opts.onUhi?.(null);
		this.#overlay('Loading…');
		this.#scheduleDraw();

		try {
			const geo = await this.#geoCache.get(slug);
			if (token !== this.#loadToken || this.#destroyed) return;
			this.#adoptGeo(geo);
		} catch (err) {
			if (token !== this.#loadToken || this.#destroyed) return;
			if (err instanceof Error && err.name === 'AbortError') return;
			this.#overlay(`Couldn't load ${this.#label || slug}.`);
		}
	}

	/**
	 * NOW / CONVERTED. The map needs no new geometry for this — the parking and
	 * calm-street layers are already loaded, only their fill colour changes — so
	 * the switch is a re-render of the existing paths, not a rebuild or a
	 * refetch.
	 */
	setStateKey(k: StateKey): void {
		if (this.#stateKey === k) return;
		this.#stateKey = k;
		this.#renderScene(null);
		this.#scheduleDraw();
	}

	/** Heat-island overlay. The PNG is fetched on the first toggle-ON for a
	 *  city, never when the toggle is off, never again on zoom. */
	async setHeat(on: boolean): Promise<void> {
		if (this.#heatOn === on) return;
		this.#heatOn = on;
		await this.#ensureUhi();
	}

	/** The cities either side of the current one in the visible list order;
	 *  prefetched when the browser is idle. */
	setNeighbours(slugs: string[]): void {
		this.#neighbours = slugs.filter((s) => s && s !== this.#slug);
	}

	resetView(): void {
		this.#resetView(false);
	}

	destroy(): void {
		if (this.#destroyed) return;
		this.#destroyed = true;
		this.#unbindListeners();
		this.#cancelPrefetch();
		if (this.#settleTimer) clearTimeout(this.#settleTimer);
		if (this.#resizeTimer) clearTimeout(this.#resizeTimer);
		this.#builder.cancel();
		this.#geoCache.destroy();
		this.#uhiCache.destroy();
		this.#geo = null;
		this.#paths = null;
		this.#snapView = null;
		// Free the backing store of the offscreen snapshot.
		this.#snap.width = 0;
		this.#snap.height = 0;
	}

	// =========================================================================
	// loading
	// =========================================================================

	#adoptGeo(geo: DecodedGeo): void {
		this.#geo = geo;
		this.#overlay(null);
		this.#opts.onUhi?.(geo.uhi ?? null);
		void this.#ensureUhi();
		this.#scheduleDraw();
		this.#schedulePrefetch();
	}

	async #loadHeatImage(slug: string, signal: AbortSignal | undefined): Promise<HeatImage> {
		const name = this.#geoCache.peek(slug)?.uhi?.png ?? `${slug}.uhi.png`;
		const res = await fetch(`${this.#geoBase}/${name}`, { signal });
		if (!res.ok) throw new Error(String(res.status));
		const blob = await res.blob();
		if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
		return new Promise<HTMLImageElement>((ok, bad) => {
			const url = URL.createObjectURL(blob);
			const im = new Image();
			im.onload = () => {
				URL.revokeObjectURL(url);
				ok(im);
			};
			im.onerror = () => {
				URL.revokeObjectURL(url);
				bad(new Error('decode'));
			};
			im.src = url;
		});
	}

	/** Make sure the current city's raster is present when the overlay is on,
	 *  then re-rasterise. Cheap and idempotent when it already is. */
	async #ensureUhi(): Promise<void> {
		const slug = this.#slug;
		const geo = this.#geo;
		if (!this.#heatOn || !slug || !geo?.uhi || this.#uhiCache.peek(slug)) {
			if (slug && this.#uhiCache.peek(slug)) this.#uhiCache.touch(slug);
			this.#renderScene(null);
			this.#scheduleDraw();
			return;
		}
		try {
			await this.#uhiCache.get(slug);
		} catch {
			return; // aborted or missing raster: the map is still fine without it
		}
		if (this.#destroyed || !this.#heatOn || this.#slug !== slug) return;
		this.#renderScene(null);
		this.#scheduleDraw();
	}

	// --- idle prefetch: at most the two neighbours in the current list order --
	#cancelPrefetch(): void {
		if (this.#idleHandle == null) return;
		if (this.#idleIsRic) cancelIdleCallback(this.#idleHandle);
		else clearTimeout(this.#idleHandle);
		this.#idleHandle = null;
	}

	#schedulePrefetch(): void {
		this.#cancelPrefetch();
		const cb = () => {
			this.#idleHandle = null;
			this.#prefetchNeighbours();
		};
		if (typeof requestIdleCallback === 'function') {
			this.#idleIsRic = true;
			this.#idleHandle = requestIdleCallback(cb, { timeout: 2500 });
		} else {
			this.#idleIsRic = false;
			this.#idleHandle = setTimeout(cb, 900) as unknown as number;
		}
	}

	#prefetchNeighbours(): void {
		if (this.#destroyed) return;
		for (const slug of this.#neighbours) {
			if (this.#geoCache.peek(slug) || this.#geoCache.loading(slug)) continue;
			this.#geoCache.get(slug).catch(() => {});
		}
	}

	// =========================================================================
	// view
	// =========================================================================

	#overlay(msg: string | null): void {
		this.#opts.onOverlay?.(msg);
	}

	#updateChrome(): void {
		const zoomed = this.#view.zoomed;
		this.#opts.onZoom?.(zoomed);
		this.#surface.style.cursor = zoomed ? 'grab' : '';
	}

	#resetView(quiet: boolean): void {
		this.#view.reset();
		this.#updateChrome();
		if (!quiet) {
			this.#settle();
			this.#scheduleDraw();
		}
	}

	#zoomAt(px: number, py: number, zNew: number): void {
		this.#view.zoomAt(px, py, zNew);
		this.#updateChrome();
		this.#scheduleDraw();
	}

	#panBy(dx: number, dy: number): void {
		this.#view.panBy(dx, dy);
		this.#scheduleDraw();
	}

	#settleSoon(): void {
		if (this.#settleTimer) clearTimeout(this.#settleTimer);
		this.#settleTimer = setTimeout(() => this.#settle(), SETTLE_MS);
	}

	#settle(): void {
		if (this.#settleTimer) clearTimeout(this.#settleTimer);
		this.#settleTimer = null;
		const geo = this.#geo;
		const v = this.#view;
		if (!geo || !v.w) return;
		const paths = this.#paths;
		if (paths && paths.geo === geo && paths.w === v.w && paths.h === v.h) {
			const t = tierFor(v.z);
			// Rebuild when the tier changed, or when a culled build no longer
			// covers the view; otherwise just re-rasterise the snapshot sharp.
			if (!this.#buildMatches(paths, t)) {
				if (!this.#buildMatches(this.#builder.pending, t)) this.#startBuild(v.w, v.h, t);
			} else if (!this.#snapMatches()) {
				this.#renderScene(null);
				this.#scheduleDraw();
			}
		}
	}

	/** Do these paths serve the current view (city, size, tier, coverage)? */
	#buildMatches(o: BuiltPaths | null, t: number): boolean {
		return (
			!!o &&
			o.geo === this.#geo &&
			o.w === this.#view.w &&
			o.h === this.#view.h &&
			o.tier === t &&
			(!o.cov || covContains(o.cov, this.#view.rect(0.05)))
		);
	}

	#startBuild(w: number, h: number, tier: number): void {
		const geo = this.#geo;
		if (!geo) return;
		const cov = tier >= 4 ? this.#view.rect(0.6) : null;
		if (!this.#builder.start(geo, w, h, tier, cov)) this.#paths = null;
	}

	#scheduleDraw(): void {
		if (this.#rafPending || this.#destroyed) return;
		this.#rafPending = true;
		requestAnimationFrame(() => {
			this.#rafPending = false;
			if (!this.#destroyed) this.#draw();
		});
	}

	// =========================================================================
	// rendering
	// =========================================================================

	/**
	 * Rasterise the scene into the offscreen snapshot. Called once per settled
	 * view (or build-progress step); `draw()` only blits the result.
	 */
	#renderScene(paths: BuiltPaths | null): void {
		const geo = this.#geo;
		const v = this.#view;
		if (!geo) return;
		if (!paths) {
			const committed = this.#paths;
			if (!(committed && committed.geo === geo && committed.w === v.w && committed.h === v.h)) {
				return;
			}
			paths = committed;
		}
		if (!v.w || !v.h) return;

		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const pw = Math.round(v.w * dpr);
		const ph = Math.round(v.h * dpr);
		if (this.#snap.width !== pw || this.#snap.height !== ph) {
			this.#snap.width = pw;
			this.#snap.height = ph;
		}
		const ctx = this.#snap.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = COLORS.bg;
		ctx.fillRect(0, 0, pw, ph);
		ctx.setTransform(dpr * v.z, 0, 0, dpr * v.z, dpr * v.tx, dpr * v.ty);

		const fillP = (p2: Path2D | undefined, col: string, alpha = 1): void => {
			if (!p2) return;
			ctx.fillStyle = col;
			ctx.globalAlpha = alpha;
			ctx.fill(p2, 'evenodd');
			ctx.globalAlpha = 1;
		};

		// Water first, under everything: sea, lakes and rivers.
		fillP(paths.water, COLORS.water);

		// Heat island wash under the street linework: the ramp's alpha is baked
		// into the PNG (validated against the plate, purple and green) and cells
		// are the model's own 100 m pixels — no smoothing, no interpolation.
		const heat = this.#slug ? this.#uhiCache.peek(this.#slug) : undefined;
		if (this.#heatOn && geo.uhi && heat) {
			const u = geo.uhi;
			const ub = geo.bounds;
			const ubw = ub[2];
			const ubh = ub[3];
			if (ubw > 0 && ubh > 0) {
				const uk = Math.min(v.w / ubw, v.h / ubh) * 0.96;
				const uox = (v.w - ubw * uk) / 2;
				const uoy = (v.h + ubh * uk) / 2;
				ctx.imageSmoothingEnabled = false;
				ctx.drawImage(
					heat,
					uox + u.rect[0] * uk,
					uoy - u.rect[3] * uk,
					(u.rect[2] - u.rect[0]) * uk,
					(u.rect[3] - u.rect[1]) * uk
				);
				ctx.imageSmoothingEnabled = true;
			}
		}

		// Arterials stay asphalt in both states — the scenario never touches them.
		fillP(paths.art, COLORS.asphalt, 0.6);
		// The two layers the conversion moves: calm streets and every surface
		// parking lot (paths.lots is built from lots + kerb together). Same
		// geometry either way, only the fill changes — which is why switching
		// state costs one re-render and no rebuild. Converted they are green, a
		// shade under the solid parks, so reclaimed ground still reads as
		// scenario rather than as measured park.
		const conv = this.#stateKey === 'scenario';
		fillP(paths.loc, conv ? COLORS.park : COLORS.asphalt, conv ? 0.7 : 0.45);
		fillP(paths.lots, conv ? COLORS.park : COLORS.parking, conv ? 0.8 : 0.6);
		// Parks on top, solid.
		fillP(paths.parks, COLORS.park);

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.#snapView = { geo, z: v.z, tx: v.tx, ty: v.ty, w: v.w, h: v.h };
		this.#snapStamp++;
	}

	#snapMatches(): boolean {
		const s = this.#snapView;
		const v = this.#view;
		return (
			!!s &&
			s.geo === this.#geo &&
			s.w === v.w &&
			s.h === v.h &&
			s.z === v.z &&
			s.tx === v.tx &&
			s.ty === v.ty
		);
	}

	#draw(): void {
		const canvas = this.#canvas;
		if (!canvas || this.#destroyed) return;
		const v = this.#view;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const r = canvas.getBoundingClientRect();
		if (!r.width || !r.height) return;
		v.w = r.width;
		v.h = r.height;
		v.clamp();

		const committed = this.#paths;
		const fits =
			!!committed &&
			committed.geo === this.#geo &&
			committed.w === r.width &&
			committed.h === r.height;
		if (this.#geo && !fits && !this.#builder.matches(this.#geo, r.width, r.height)) {
			// (Re)build paths for this city/size — incrementally, off this frame.
			this.#startBuild(r.width, r.height, tierFor(v.z));
		}

		// The rendered map only changes with size/dpr/city/view/snapshot — skip
		// identical frames.
		const key =
			`${r.width}x${r.height}|${dpr}|${this.#loadToken}|${!!this.#geo}|` +
			`${v.z.toFixed(4)}|${v.tx.toFixed(1)}|${v.ty.toFixed(1)}|${this.#snapStamp}`;
		if (key === this.#drawKey) return;
		this.#drawKey = key;

		const pw = Math.round(r.width * dpr);
		const ph = Math.round(r.height * dpr);
		if (canvas.width !== pw || canvas.height !== ph) {
			canvas.width = pw;
			canvas.height = ph;
		}
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.fillStyle = COLORS.bg;
		ctx.fillRect(0, 0, r.width, r.height);
		if (!this.#geo) {
			this.#paths = null;
			this.#builder.cancel();
			this.#snapView = null;
			return;
		}
		const s = this.#snapView;
		if (!s || s.geo !== this.#geo) return; // still loading: background only

		// Blit the snapshot through the delta between its view and the current
		// one — pixel-exact at rest, briefly soft mid-gesture, sharp on settle.
		const exact =
			this.#snapMatches() &&
			this.#snap.width === canvas.width &&
			this.#snap.height === canvas.height;
		if (exact) {
			ctx.setTransform(1, 0, 0, 1, 0, 0); // at rest: exact device-pixel copy
			ctx.drawImage(this.#snap, 0, 0);
			return;
		}
		const f = v.z / s.z;
		ctx.drawImage(this.#snap, v.tx - s.tx * f, v.ty - s.ty * f, s.w * f, s.h * f);
	}

	// =========================================================================
	// gestures
	// =========================================================================

	#twoPtrs(): Array<{ x: number; y: number }> {
		return Array.from(this.#ptrs.values()).slice(0, 2);
	}

	#onPointerDown = (e: PointerEvent): void => {
		// The map sits in the flow of a scrolling article, so a finger on it has
		// to belong to the page: touch pans and pinches are not ours to take.
		if (e.pointerType === 'touch') return;
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		this.#boxRect = this.#canvas.getBoundingClientRect();
		this.#ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (this.#ptrs.size === 2) {
			const [a, b] = this.#twoPtrs();
			this.#pinch = {
				d: Math.hypot(a.x - b.x, a.y - b.y),
				mx: (a.x + b.x) / 2,
				my: (a.y + b.y) / 2
			};
		}
		try {
			this.#surface.setPointerCapture(e.pointerId);
		} catch {
			/* pointer already gone */
		}
		if (e.pointerType === 'mouse') e.preventDefault();
		if (this.#view.zoomed) this.#surface.style.cursor = 'grabbing';
	};

	#onPointerMove = (e: PointerEvent): void => {
		const p = this.#ptrs.get(e.pointerId);
		if (!p) return;
		const dx = e.clientX - p.x;
		const dy = e.clientY - p.y;
		p.x = e.clientX;
		p.y = e.clientY;
		const box = this.#boxRect;
		if (this.#pinch && this.#ptrs.size >= 2 && box) {
			const [a, b] = this.#twoPtrs();
			const d = Math.max(12, Math.hypot(a.x - b.x, a.y - b.y));
			const mx = (a.x + b.x) / 2;
			const my = (a.y + b.y) / 2;
			this.#zoomAt(mx - box.left, my - box.top, this.#view.z * (d / this.#pinch.d));
			this.#panBy(mx - this.#pinch.mx, my - this.#pinch.my);
			this.#pinch.d = d;
			this.#pinch.mx = mx;
			this.#pinch.my = my;
		} else if (this.#ptrs.size === 1) {
			this.#panBy(dx, dy);
		}
	};

	#onPointerEnd = (e: PointerEvent): void => {
		if (!this.#ptrs.has(e.pointerId)) return;
		this.#ptrs.delete(e.pointerId);
		if (this.#ptrs.size < 2) this.#pinch = null;
		if (this.#ptrs.size !== 0) return;
		this.#updateChrome();
		this.#settle();
	};

	#onWheel = (e: WheelEvent): void => {
		e.preventDefault();
		const box = (this.#boxRect = this.#canvas.getBoundingClientRect());
		const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 120 : 1);
		this.#zoomAt(e.clientX - box.left, e.clientY - box.top, this.#view.z * Math.pow(2, -dy / 320));
		this.#settleSoon();
	};

	#onDblClick = (e: MouseEvent): void => {
		e.preventDefault();
		const box = (this.#boxRect = this.#canvas.getBoundingClientRect());
		this.#zoomAt(e.clientX - box.left, e.clientY - box.top, this.#view.z * 2);
		this.#settleSoon();
	};

	#onKeyDown = (e: KeyboardEvent): void => {
		let handled = true;
		const step = 60;
		const cx = this.#view.w / 2;
		const cy = this.#view.h / 2;
		if (e.key === '+' || e.key === '=') this.#zoomAt(cx, cy, this.#view.z * 1.5);
		else if (e.key === '-' || e.key === '_') this.#zoomAt(cx, cy, this.#view.z / 1.5);
		else if (e.key === '0') this.#resetView(false);
		else if (e.key === 'ArrowLeft') this.#panBy(step, 0);
		else if (e.key === 'ArrowRight') this.#panBy(-step, 0);
		else if (e.key === 'ArrowUp') this.#panBy(0, step);
		else if (e.key === 'ArrowDown') this.#panBy(0, -step);
		else handled = false;
		if (handled) {
			e.preventDefault();
			this.#settleSoon();
		}
	};

	#onResize = (): void => {
		if (this.#resizeTimer) clearTimeout(this.#resizeTimer);
		this.#resizeTimer = setTimeout(() => this.#draw(), 120);
	};

	#bindListeners(): void {
		const s = this.#surface;
		s.addEventListener('pointerdown', this.#onPointerDown);
		s.addEventListener('pointermove', this.#onPointerMove);
		s.addEventListener('pointerup', this.#onPointerEnd);
		s.addEventListener('pointercancel', this.#onPointerEnd);
		s.addEventListener('wheel', this.#onWheel, { passive: false });
		s.addEventListener('dblclick', this.#onDblClick);
		s.addEventListener('keydown', this.#onKeyDown);
		window.addEventListener('resize', this.#onResize);
		if (typeof ResizeObserver === 'function') {
			this.#resizeObserver = new ResizeObserver(() => this.#scheduleDraw());
			this.#resizeObserver.observe(this.#canvas);
		}
	}

	#unbindListeners(): void {
		const s = this.#surface;
		s.removeEventListener('pointerdown', this.#onPointerDown);
		s.removeEventListener('pointermove', this.#onPointerMove);
		s.removeEventListener('pointerup', this.#onPointerEnd);
		s.removeEventListener('pointercancel', this.#onPointerEnd);
		s.removeEventListener('wheel', this.#onWheel);
		s.removeEventListener('dblclick', this.#onDblClick);
		s.removeEventListener('keydown', this.#onKeyDown);
		window.removeEventListener('resize', this.#onResize);
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
	}
}
