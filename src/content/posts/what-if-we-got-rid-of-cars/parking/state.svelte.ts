/**
 * View state for the "What if we got rid of cars?" piece — one object per
 * instrument, not one per page.
 *
 * The article carries three independent instruments: two scroll-driven
 * rankings and a standalone map. A module-level `$state` singleton would make
 * them share a sort key and a state toggle, so sorting one would silently
 * re-sort the others. Instead a layout component (`<ScrollyRanking />`,
 * `<MapPanel />`, `<Board />`) calls `createView()` once and publishes it with
 * `provideView()`; every control and chart nested under it picks the same
 * object up with `useView()`. Nothing imports a shared instance.
 *
 * Svelte 5 runes: `$state` on a plain object, so the proxy the factory returns
 * stays live wherever it is passed.
 */
import { getContext, setContext } from 'svelte';

export type StateKey = 'now' | 'scenario';
export type SortKey = 'zero' | 'green' | 'car' | 'city';
export type SortDir = 'asc' | 'desc';

/**
 * The direction a key sorts in when you first switch to it. The three number
 * columns are interesting from the top — who has the most green, the most
 * asphalt, the most residents with nothing — while a name column is only ever
 * looked up alphabetically. Clicking the active key flips it from here.
 */
export const SORT_DEFAULT_DIR: Record<SortKey, SortDir> = {
	zero: 'desc',
	green: 'desc',
	car: 'desc',
	city: 'asc'
};

export interface View {
	slug: string;
	stateKey: StateKey;
	sortKey: SortKey;
	sortDir: SortDir;
	heat: boolean;
}

export interface ViewInit {
	slug?: string;
	stateKey?: StateKey;
	sortKey?: SortKey;
	/** Defaults to the key's own `SORT_DEFAULT_DIR` entry. */
	sortDir?: SortDir;
}

export function createView(init: ViewInit = {}): View {
	const sortKey = init.sortKey ?? 'green';
	const view: View = $state({
		slug: init.slug ?? 'prague',
		stateKey: init.stateKey ?? 'now',
		sortKey,
		sortDir: init.sortDir ?? SORT_DEFAULT_DIR[sortKey],
		heat: false
	});
	return view;
}

/** Symbol rather than a string key, so nothing outside this module can collide. */
const VIEW = Symbol('parking view');

/** Call during a layout component's init; returns the view for convenience. */
export function provideView(view: View): View {
	setContext(VIEW, view);
	return view;
}

export function useView(): View {
	return getContext<View>(VIEW);
}
