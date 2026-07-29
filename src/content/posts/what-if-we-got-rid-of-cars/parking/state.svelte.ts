/**
 * Shared view state for the "What if we got rid of cars?" piece.
 *
 * Every component in `parking/` reads and writes this single object — nobody
 * keeps a private copy. Svelte 5 runes: `$state` on a plain object, so imports
 * stay live across modules.
 */

export type StateKey = 'now' | 'scenario';
export type SortKey = 'zero' | 'green' | 'car';

export const view = $state({
	slug: 'prague' as string,
	stateKey: 'now' as StateKey,
	sortKey: 'zero' as SortKey,
	heat: false,
	fullscreen: false
});
