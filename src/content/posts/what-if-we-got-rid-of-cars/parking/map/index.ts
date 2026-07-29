/**
 * The canvas map, as a framework-agnostic module.
 *
 * `ParkMap` is the only thing the Svelte layer needs; the rest is exported for
 * types and for anything that wants to reuse the decoder or the LRU.
 */
export { ParkMap, type ParkMapOptions } from './park-map';
export { COLORS } from './colors';
export { fmt1 } from './format';
export {
	decodeGeo,
	decodeRing,
	LAYERS,
	type DecodedFeature,
	type DecodedGeo,
	type GeoJson,
	type LayerKey,
	type RawFeature,
	type UhiInfo
} from './geometry';
export { PathBuilder, type BuiltPaths } from './path-builder';
export { ResourceCache, type ResourceCacheOptions } from './resource-cache';
export { MapView, MAX_ZOOM, covContains, tierFor, type Rect } from './view';
