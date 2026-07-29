/**
 * View state: `z` = zoom (1 = fit city, the minimum), `tx`/`ty` = pan in CSS px.
 *
 *     screen = base_fit_coords * z + t
 *
 * `w`/`h` are the canvas size in CSS px (the prototype's `vs`). Ported from the
 * `view` / `vs` pair and the `clampView`, `zoomAt`, `panBy`, `viewRect`,
 * `tierFor` and `covContains` functions.
 *
 * Pure geometry — no canvas, no listeners, no redraw side effects. The renderer
 * decides when to redraw after mutating it.
 */

/** `[x0, y0, x1, y1]` in base-fit coordinates. */
export type Rect = [number, number, number, number];

export const MAX_ZOOM = 9;

export class MapView {
	z = 1;
	tx = 0;
	ty = 0;
	w = 0;
	h = 0;

	get zoomed(): boolean {
		return this.z > 1.001;
	}

	clamp(): void {
		this.z = Math.max(1, Math.min(MAX_ZOOM, this.z));
		this.tx = Math.min(0, Math.max(this.w * (1 - this.z), this.tx));
		this.ty = Math.min(0, Math.max(this.h * (1 - this.z), this.ty));
	}

	reset(): void {
		this.z = 1;
		this.tx = 0;
		this.ty = 0;
	}

	/** Zoom about a point in canvas CSS px, keeping that point fixed. */
	zoomAt(px: number, py: number, zNew: number): void {
		const z = Math.max(1, Math.min(MAX_ZOOM, zNew));
		const f = z / this.z;
		this.tx = px - (px - this.tx) * f;
		this.ty = py - (py - this.ty) * f;
		this.z = z;
		this.clamp();
	}

	panBy(dx: number, dy: number): void {
		this.tx += dx;
		this.ty += dy;
		this.clamp();
	}

	/** Visible rect in base-fit coords, expanded by `margin` × viewport size. */
	rect(margin: number): Rect {
		const x0 = -this.tx / this.z;
		const y0 = -this.ty / this.z;
		const wv = this.w / this.z;
		const hv = this.h / this.z;
		const m = margin * Math.max(wv, hv);
		return [x0 - m, y0 - m, x0 + wv + m, y0 + hv + m];
	}
}

/**
 * Decimation tier: paths are rebuilt finer as you zoom in, but only on settle —
 * while gesturing we blit the last snapshot, then snap to sharp.
 */
export function tierFor(z: number): number {
	return z < 1.5 ? 1 : z < 3 ? 2 : z < 6 ? 4 : 8;
}

export function covContains(cov: Rect, r: Rect): boolean {
	return cov[0] <= r[0] && cov[1] <= r[1] && cov[2] >= r[2] && cov[3] >= r[3];
}
