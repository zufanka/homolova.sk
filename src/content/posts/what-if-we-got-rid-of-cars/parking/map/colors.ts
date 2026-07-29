/**
 * The map palette.
 *
 * Ported verbatim from the `COL` object in park-ing's `src/proto.template.html`.
 * These are canvas fill colours, not CSS — the surrounding chrome carries its
 * own component-scoped `--pk-*` custom properties with the same values, so the
 * legend swatches and the map agree.
 */
export const COLORS = {
	park: '#0a6b40',
	parking: '#6d3f96',
	asphalt: '#7d4a9e',
	water: '#c3d9e8',
	bg: '#fdf5f0'
} as const;
