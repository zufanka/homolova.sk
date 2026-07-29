<script lang="ts">
  /**
   * The two-column board: the ranked list of capitals beside the city map.
   *
   * This component owns only the arrangement — the grid proportions, the
   * sticky map column, and the collapse to a stacked layout below 900 px. It
   * composes the map (Agent 2) and the ranking controls (Agent 3) and
   * implements none of their internals.
   *
   * Layout contract with <CityMap />: the grid publishes a `--map-h` custom
   * property on `.split` — `min(66vh, 40rem)` on wide screens, `min(30vh, 12rem)`
   * when the map is pinned to the bottom of a phone. It inherits down, so the
   * map sizes its canvas from it rather than measuring the viewport itself.
   */
  import type { CityRow } from './types';
  import CityMap from './CityMap.svelte';
  import HeatLegend from './HeatLegend.svelte';
  import Ranking from './Ranking.svelte';
  import StateToggle from './StateToggle.svelte';
  import SortButtons from './SortButtons.svelte';

  let { rows }: { rows: CityRow[] } = $props();
</script>

<div class="split">
  <div class="mapcol">
    <!-- The sticky frame belongs to the layout; everything inside it is the
         map's own chrome. On wide screens it follows the list down the page;
         on phones it pins to the bottom of the viewport while the list scrolls. -->
    <div class="mapstick">
      <CityMap />
      <HeatLegend />
    </div>
  </div>

  <div class="listcol">
    <div class="legend">
      <span><i style="background:#0a6b40"></i>Urban green</span>
      <span><i style="background:#7d4a9e"></i>Car infrastructure</span>
      <span><i style="background:#c3d9e8"></i>Water</span>
    </div>
    <StateToggle />
    <SortButtons />
    <Ranking {rows} />
    <p class="axis-note">
      Source: OpenStreetMap. † = parking under-mapped in OpenStreetMap.
    </p>
  </div>
</div>

<style>
  @media (min-width: 900px) {
    .split {
      display: grid;
      gap: 1.8rem;
      align-items: start;
      /* the list needs ~23rem before the ranking's diverging spine (a 1fr
         column between four fixed ones) gets squeezed to nothing — hence the
         raised minimum and the gentler ratio against the map */
      grid-template-columns: minmax(23rem, 1fr) minmax(0, 1.5fr);
      --map-h: min(66vh, 40rem);
    }
    /* the list is the narrow left column, the map the wide right one — but the
       map comes first in the DOM so it is the one that pins on small screens */
    .listcol {
      grid-column: 1;
      grid-row: 1;
    }
    .mapcol {
      grid-column: 2;
      grid-row: 1;
      height: 100%;
    }
    .mapstick {
      position: sticky;
      top: 1.5rem;
    }
  }

  @media (max-width: 899px) {
    /* map pinned to the BOTTOM of small screens; the list scrolls above it */
    .split {
      display: flex;
      flex-direction: column;
      --map-h: min(30vh, 12rem);
    }
    .listcol {
      order: 1;
    }
    .mapcol {
      display: contents;
    }
    .mapstick {
      order: 2;
      position: sticky;
      bottom: 0;
      z-index: 5;
      background: var(--bg);
      padding: 0.5rem 0 0;
      border-top: 1.5px solid var(--ink);
      box-shadow: 0 -8px 12px -8px rgba(2, 2, 2, 0.3);
      margin-top: 1rem;
    }
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.1rem;
    font-size: 0.8rem;
    font-weight: 500;
    margin: 0 0 0.7rem;
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .legend i {
    width: 0.85rem;
    height: 0.85rem;
    border: 1.5px solid var(--ink);
    display: block;
    flex: none;
  }

  .axis-note {
    max-width: var(--measure);
    margin: 0.9rem 0 0;
    font-size: 0.83rem;
    line-height: 1.5;
    color: var(--muted);
  }
</style>
