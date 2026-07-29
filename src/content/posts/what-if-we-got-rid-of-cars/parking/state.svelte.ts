/**
 * Shared view state for the "What if we got rid of cars?" piece.
 *
 * Every component in `parking/` reads and writes this single object — nobody
 * keeps a private copy. Svelte 5 runes: `$state` on a plain object, so imports
 * stay live across modules.
 */

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

export const view = $state({
	slug: 'prague' as string,
	stateKey: 'now' as StateKey,
	// opens ranked by green, largest first, so the prose's "Helsinki, Prague and
	// Stockholm come on top" is the first thing the list actually shows
	sortKey: 'green' as SortKey,
	sortDir: SORT_DEFAULT_DIR.green as SortDir,
	heat: false,
	fullscreen: false
});
