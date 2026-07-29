/**
 * Incremental Path2D builder.
 *
 * Geometry is emitted as SVG path strings and parsed natively in one
 * `new Path2D(string)` call per chunk: profiling in the prototype showed a
 * `moveTo`/`lineTo` call per vertex is ~50–100× slower (the JS→C++ binding per
 * call was the entire 17 s London stall; rasterisation itself was ~11 ms).
 *
 * The work is sliced across animation frames so no single task stalls the main
 * thread, the first appearance is progressive (layers show as they finish), and
 * at high zoom tiers only rings whose bounding box intersects the expanded
 * viewport are built — the result remembers that coverage (`cov`) so panning
 * past it triggers a rebuild on settle.
 *
 * Ported from `startBuild` / `pump` / `ringsToParts` in park-ing's prototype.
 */

import type { DecodedFeature, DecodedGeo } from './geometry';
import type { Rect } from './view';

/** One committed (or in-flight) set of layer paths. */
export interface BuiltPaths {
	geo: DecodedGeo;
	w: number;
	h: number;
	tier: number;
	cov: Rect | null;
	water?: Path2D;
	art?: Path2D;
	loc?: Path2D;
	lots?: Path2D;
	parks?: Path2D;
}

type LayerSlot = 'water' | 'art' | 'loc' | 'lots' | 'parks';

export interface PathBuilderHooks {
	/** Has the renderer moved on to another city since this build started? */
	stillValid: (geo: DecodedGeo) => boolean;
	/** A frame's worth of tasks finished and more remain. */
	onProgress: (out: BuiltPaths) => void;
	/** Every task is done; the renderer decides whether to commit `out`. */
	onDone: (out: BuiltPaths) => void;
}

/** Per-frame budget, in ms, for path building. */
const FRAME_BUDGET_MS = 20;
/** Vertices per chunk for the polygon layers. */
const CHUNK_POINTS = 70_000;
/** Features per chunk for the parking layer (which is mostly tiny dots). */
const CHUNK_LOTS = 4000;

export class PathBuilder {
	readonly #hooks: PathBuilderHooks;
	#tasks: Array<() => void> = [];
	#i = 0;
	#out: BuiltPaths | null = null;
	#raf = 0;

	constructor(hooks: PathBuilderHooks) {
		this.#hooks = hooks;
	}

	/** The in-flight result, or null when idle. */
	get pending(): BuiltPaths | null {
		return this.#out;
	}

	/** Is a build for this city and canvas size already running? */
	matches(geo: DecodedGeo | null, w: number, h: number): boolean {
		const o = this.#out;
		return !!o && !!geo && o.geo === geo && o.w === w && o.h === h;
	}

	cancel(): void {
		if (this.#raf) cancelAnimationFrame(this.#raf);
		this.#raf = 0;
		this.#tasks = [];
		this.#i = 0;
		this.#out = null;
	}

	/**
	 * Queue a full rebuild. Returns false when the city has degenerate bounds,
	 * in which case there is nothing to draw.
	 */
	start(geo: DecodedGeo, w: number, h: number, tier: number, cov: Rect | null): boolean {
		this.cancel();
		const b = geo.bounds;
		const bw = b[2];
		const bh = b[3];
		if (!(bw > 0 && bh > 0)) return false;

		// Base-fit transform: quantum units → CSS px, y flipped, 4% margin.
		const k = Math.min(w / bw, h / bh) * 0.96;
		const ox = (w - bw * k) / 2;
		const oy = (h + bh * k) / 2;
		// Metres per pixel, straight from the file's own quantum.
		const mpp = geo.q / k;

		// Decimate to ~pixel fidelity: points close to the previous kept point
		// add nothing visually. The threshold scales with the city's vertex
		// count so the heaviest capitals stay cheap, and shrinks with the zoom
		// tier so zoomed views are rebuilt sharp.
		const thr2 =
			(geo.totalPts > 1_200_000 ? 5.76 : geo.totalPts > 400_000 ? 1.69 : 0.64) / (tier * tier);

		// At high tiers only a zoomed-in sliver is visible: cull rings to the
		// viewport plus a wide margin, and remember that coverage.
		let cx0 = 0;
		let cx1 = 0;
		let cy0 = 0;
		let cy1 = 0;
		if (cov) {
			// coverage translated to raw ring coords (y flips)
			cx0 = (cov[0] - ox) / k;
			cx1 = (cov[2] - ox) / k;
			cy0 = (oy - cov[3]) / k;
			cy1 = (oy - cov[1]) / k;
		}

		const ringsToParts = (f: DecodedFeature, parts: string[]): void => {
			const bb = f.bb;
			for (let i = 0; i < f.p.length; i++) {
				const r = f.p[i];
				if (r.length < 6) continue;
				if (
					cov &&
					(bb[i * 4 + 2] < cx0 || bb[i * 4] > cx1 || bb[i * 4 + 3] < cy0 || bb[i * 4 + 1] > cy1)
				) {
					continue;
				}
				let lx = r[0] * k + ox;
				let ly = -r[1] * k + oy;
				let s = 'M' + lx.toFixed(2) + ' ' + ly.toFixed(2);
				for (let j = 2; j < r.length; j += 2) {
					const X = r[j] * k + ox;
					const Y = -r[j + 1] * k + oy;
					const dx = X - lx;
					const dy = Y - ly;
					if (dx * dx + dy * dy < thr2) continue;
					s += 'L' + X.toFixed(2) + ' ' + Y.toFixed(2);
					lx = X;
					ly = Y;
				}
				parts.push(s + 'Z');
			}
		};

		const out: BuiltPaths = { geo, w, h, tier, cov };
		const tasks: Array<() => void> = [];

		// Each task builds one chunk's path string, parses it natively, and
		// merges it into the layer's single Path2D via addPath — so no task
		// joins/parses a whole giant layer, yet the layer stays one path object
		// and within-layer evenodd + alpha compositing behave exactly as a
		// monolithic path (no chunk seams).
		const addParts = (name: LayerSlot, parts: string[]): void => {
			if (!parts.length) return;
			const p = new Path2D(parts.join(''));
			const existing = out[name];
			if (existing) existing.addPath(p);
			else out[name] = p;
		};
		const mkChunk =
			(name: LayerSlot, chunk: DecodedFeature[]) =>
			(): void => {
				const parts: string[] = [];
				for (const f of chunk) ringsToParts(f, parts);
				addParts(name, parts);
			};
		const layerTasks = (name: LayerSlot, feats: DecodedFeature[]): void => {
			let chunk: DecodedFeature[] = [];
			let n = 0;
			for (const f of feats) {
				chunk.push(f);
				for (const r of f.p) n += r.length;
				if (n > CHUNK_POINTS) {
					tasks.push(mkChunk(name, chunk));
					chunk = [];
					n = 0;
				}
			}
			if (chunk.length) tasks.push(mkChunk(name, chunk));
		};

		layerTasks('water', geo.water);
		layerTasks('art', geo.arterial);
		layerTasks('loc', geo.local);

		// Parking keeps the minimum-dot treatment so small lots stay visible;
		// the cutoff is judged in drawn pixels at this zoom tier. Dots are two
		// SVG arcs so this layer, too, parses natively.
		{
			const dx0 = cov ? cov[0] : -6;
			const dx1 = cov ? cov[2] : w + 6;
			const dy0 = cov ? cov[1] : -6;
			const dy1 = cov ? cov[3] : h + 6;
			const all = geo.allParking;
			const lotChunk = (from: number, to: number) => (): void => {
				const parts: string[] = [];
				for (let fi = from; fi < to; fi++) {
					const f = all[fi];
					const side = Math.sqrt(f.a ?? 0) / mpp;
					if (side * tier < 2.4) {
						const c = f.c;
						if (!c) continue;
						const cx = c[0] * k + ox;
						const cy = -c[1] * k + oy;
						if (cx < dx0 || cx > dx1 || cy < dy0 || cy > dy1) continue;
						const rr = Math.max(0.7 / tier, side / 2);
						const rs = rr.toFixed(2);
						const d = (rr * 2).toFixed(2);
						parts.push(
							'M' +
								(cx + rr).toFixed(2) +
								' ' +
								cy.toFixed(2) +
								'a' +
								rs +
								' ' +
								rs +
								' 0 1 0 -' +
								d +
								' 0' +
								'a' +
								rs +
								' ' +
								rs +
								' 0 1 0 ' +
								d +
								' 0'
						);
					} else {
						ringsToParts(f, parts);
					}
				}
				addParts('lots', parts);
			};
			for (let s0 = 0; s0 < all.length; s0 += CHUNK_LOTS) {
				tasks.push(lotChunk(s0, Math.min(s0 + CHUNK_LOTS, all.length)));
			}
		}

		layerTasks('parks', geo.parks);

		this.#tasks = tasks;
		this.#i = 0;
		this.#out = out;
		this.#pump();
		return true;
	}

	/** Run build tasks inside a per-frame budget so the map never stalls input. */
	#pump = (): void => {
		this.#raf = 0;
		const out = this.#out;
		if (!out) return;
		if (!this.#hooks.stillValid(out.geo)) {
			this.cancel();
			return;
		}
		const deadline = performance.now() + FRAME_BUDGET_MS;
		while (this.#i < this.#tasks.length && performance.now() < deadline) this.#tasks[this.#i++]();
		if (this.#i < this.#tasks.length) {
			this.#hooks.onProgress(out);
			this.#raf = requestAnimationFrame(this.#pump);
			return;
		}
		this.#tasks = [];
		this.#i = 0;
		this.#out = null;
		this.#hooks.onDone(out);
	};
}
