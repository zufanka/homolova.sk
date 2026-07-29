/**
 * The heat-island metadata of whichever city the map currently has loaded.
 *
 * `<CityMap />` writes it (only the renderer knows what the geo file said);
 * `<HeatLegend />` reads it. It is not part of `view` because it is *derived
 * from the data*, not a user choice — `view.heat` is the toggle, this is what
 * the toggle has to describe.
 */
import type { UhiInfo } from './geometry';

export const heat = $state({
	/** `uhi` from the loaded geo file, or null while loading / when the city
	 *  is outside the UrbClim coverage. */
	info: null as UhiInfo | null,
	/** The city the info belongs to, for the "no model for X" sentence. */
	city: '',
	/** Does this city have a model at all (from the city row, known before the
	 *  geometry arrives)? */
	available: false
});
