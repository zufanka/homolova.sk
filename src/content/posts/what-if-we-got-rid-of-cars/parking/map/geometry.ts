/**
 * Decoding of `/posts/what-if-we-got-rid-of-cars/geo/<slug>.json`.
 *
 * The wire format is **self-describing**: every file carries its own quantum
 * (`q`, metres per integer unit), origin (`o`), reference latitude (`lat0`) and
 * `bounds` in quantum units. Nothing here hardcodes a quantum — re-quantising
 * the export in park-ing needs no change on this side.
 *
 * Rings are delta-encoded flat `[x, y, dx, dy, dx, dy, …]` arrays in quantum
 * units. `decodeRing` runs the prefix sum and records the ring's bounding box
 * so the path builder can cull rings against the viewport at high zoom.
 */

import type { GeoFile, UhiMeta } from '../types';

/** `uhi` as it actually appears on the wire — `UhiMeta` plus the PNG filename. */
export interface UhiInfo extends UhiMeta {
	png?: string;
}

/** A feature straight off the wire. Parking lots additionally carry an area
 *  (`a`, m²) and a centroid (`c`, quantum units) used for the minimum-dot
 *  treatment that keeps small lots visible when zoomed out. */
export interface RawFeature {
	p: number[][];
	a?: number;
	c?: [number, number];
}

/** A feature after `decodeGeo`: absolute coordinates plus a flat bounding-box
 *  table, four numbers (minx, miny, maxx, maxy) per ring. */
export interface DecodedFeature {
	p: Int32Array[];
	bb: number[];
	a?: number;
	c?: [number, number];
}

/** The layers the renderer draws, in the order they are built. */
export const LAYERS = ['lots', 'kerb', 'parks', 'arterial', 'local', 'water'] as const;
export type LayerKey = (typeof LAYERS)[number];

export interface DecodedGeo {
	bounds: [number, number, number, number];
	o: [number, number];
	q: number;
	lat0: number;
	uhi?: UhiInfo;
	lots: DecodedFeature[];
	kerb: DecodedFeature[];
	parks: DecodedFeature[];
	arterial: DecodedFeature[];
	local: DecodedFeature[];
	water: DecodedFeature[];
	/** Total vertex count across every layer; drives the decimation threshold. */
	totalPts: number;
	/** `lots` + `kerb`: the two layers the conversion scenario recolours. */
	allParking: DecodedFeature[];
}

/** The raw JSON shape, i.e. `GeoFile` with the wire-level extras. */
export type GeoJson = Omit<GeoFile, 'uhi'> & { uhi?: UhiInfo };

/**
 * Delta-decode one ring. Records its bounding box (raw quantum coords) into
 * `bb` so rings can be culled cheaply against the viewport at high zoom.
 */
export function decodeRing(flat: number[], bb: number[]): Int32Array {
	const out = new Int32Array(flat.length);
	let x = flat[0];
	let y = flat[1];
	let mnx = x;
	let mny = y;
	let mxx = x;
	let mxy = y;
	out[0] = x;
	out[1] = y;
	for (let i = 2; i < flat.length; i += 2) {
		x += flat[i];
		y += flat[i + 1];
		out[i] = x;
		out[i + 1] = y;
		if (x < mnx) mnx = x;
		else if (x > mxx) mxx = x;
		if (y < mny) mny = y;
		else if (y > mxy) mxy = y;
	}
	bb.push(mnx, mny, mxx, mxy);
	return out;
}

/**
 * Decode every layer of a geo file in place and attach the derived fields the
 * renderer needs. Returns the same object, retyped.
 */
export function decodeGeo(raw: GeoJson): DecodedGeo {
	const g = raw as unknown as DecodedGeo;
	let total = 0;
	for (const key of LAYERS) {
		const feats = (raw as unknown as Record<string, RawFeature[] | undefined>)[key] ?? [];
		const decoded: DecodedFeature[] = [];
		for (const f of feats) {
			const bb: number[] = [];
			const rings = (f.p as unknown as number[][]).map((r) => {
				total += r.length / 2;
				return decodeRing(r, bb);
			});
			decoded.push({ ...f, p: rings, bb });
		}
		g[key] = decoded;
	}
	g.totalPts = total;
	g.allParking = g.lots.concat(g.kerb);
	return g;
}
