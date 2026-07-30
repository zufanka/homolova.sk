/** Data types for the "What if we got rid of cars?" piece. */

import type { SortDir, SortKey } from './state.svelte';

export interface Metrics {
	zeroGreen: number;
	medGreen: number;
	medCar: number;
}

export interface CityRow {
	slug: string;
	city: string;
	country: string;
	pop: number;
	land: number;
	popShare: number | null;
	now: Metrics;
	scenario: Metrics;
	parks: number;
	parking: number;
	localNp: number;
	car: number;
	thin: boolean;
	sparse: boolean;
	uhi: boolean;
	cells: number;
}

/**
 * One step of a scroll-driven ranking: the sort it claims when it becomes the
 * active step, the sentence that pins while it does, and an optional predicate
 * marking the rows that sentence is about.
 */
export interface ScrollyStep {
	sortKey: SortKey;
	/** Defaults to the key's own `SORT_DEFAULT_DIR` entry. */
	sortDir?: SortDir;
	/**
	 * The sentence, as inline HTML — it carries emphasis, and `<b>` plus the
	 * `g` / `c` classes for a green or a car figure are what the scrolly styles.
	 * Authored in the article next to the rest of the prose, so it is trusted
	 * the same way the rest of the article's markup is.
	 */
	html: string;
	highlight?: (c: CityRow) => boolean;
}

export interface UhiMeta {
	rect: [number, number, number, number];
	w: number;
	h: number;
	min: number;
	max: number;
	scale: [number, number];
	/** Raster filename, if it differs from `<slug>.uhi.png`. */
	png?: string;
}

/** A city's map geometry. Self-describing: carries its own quantum and origin. */
export interface GeoFile {
	bounds: [number, number, number, number];
	o: [number, number];
	q: number;
	lat0: number;
	parks?: Feature[];
	lots?: Feature[];
	kerb?: Feature[];
	arterial?: Feature[];
	local?: Feature[];
	water?: Feature[];
	uhi?: UhiMeta;
}

/** Delta-encoded ring; decoded with the parent GeoFile's `q` and `o`. */
export interface Feature {
	p: number[][];
	/** Area in m². Parking layers only. The renderer draws a lot smaller than
	 *  its minimum on-screen size as a dot rather than a shape, so kerbside
	 *  strips survive at low zoom instead of collapsing to nothing. */
	a?: number;
	/** Centroid, in the same quantised space as `p` — where that dot goes. */
	c?: [number, number];
}
