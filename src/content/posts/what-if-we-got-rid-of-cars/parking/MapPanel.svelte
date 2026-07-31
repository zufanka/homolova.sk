<script lang="ts">
  /**
   * The map on its own. No ranking beside it any more, so the reader picks a
   * city from a select instead of from a list of rows.
   *
   * The picker is three controls — prev, a native select, next — rather than a
   * new kind of widget: native select gets scrolling, type-ahead and keyboard
   * for free, and 39 options do not need more than that.
   *
   * Its own instrument: it creates the view its map, heat key and state toggle
   * read, so the rankings further up the article cannot move it.
   *
   * Layout contract with `<CityMap />`: this panel owns the map's dimensions
   * and publishes them as custom properties — `--map-h` for the canvas height,
   * `--map-bleed` for how far the plate may reach past the article's gutter —
   * so nothing inside the map has to measure the viewport.
   */
  import CityMap from './CityMap.svelte';
  import HeatLegend from './HeatLegend.svelte';
  import StateToggle from './StateToggle.svelte';
  import { createView, provideView } from './state.svelte';
  import type { CityRow } from './types';

  let { rows }: { rows: CityRow[] } = $props();

  /** Alphabetical: the select is a lookup, not a ranking. `<CityMap />` also
   *  steps prev / next and prefetches neighbours in the order it is handed, so
   *  the arrows walk the same order the list shows. */
  const ordered = $derived([...rows].sort((a, b) => a.city.localeCompare(b.city)));

  const view = provideView(createView({ slug: 'prague' }));

  function step(d: number): void {
    const i = ordered.findIndex((c) => c.slug === view.slug);
    const n = ordered.length;
    view.slug = ordered[(((i + d) % n) + n) % n].slug;
  }
</script>

<section class="mappanel" aria-label="City map">
  <div class="pick">
    <button type="button" class="pickbtn" onclick={() => step(-1)} aria-label="Previous city">
      <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"
        ><path d="M9 1 L2 6 L9 11" fill="none" stroke="currentColor" stroke-width="1.8" /></svg
      >
    </button>
    <select
      class="picksel"
      aria-label="Choose a city"
      value={view.slug}
      onchange={(e) => (view.slug = e.currentTarget.value)}
    >
      {#each ordered as c (c.slug)}
        <option value={c.slug}>{c.city}</option>
      {/each}
    </select>
    <button type="button" class="pickbtn" onclick={() => step(1)} aria-label="Next city">
      <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"
        ><path d="M1 1 L8 6 L1 11" fill="none" stroke="currentColor" stroke-width="1.8" /></svg
      >
    </button>
  </div>

  <StateToggle />
  <CityMap rows={ordered} />
  <HeatLegend />

  <p class="note">
    <strong>Click HEAT</strong> to see the city's modelled summer heat island over its streets.<br />
  </p>
</section>

<style>
  .mappanel {
    max-width: 52rem;
    margin-inline: auto;
    /* the map's canvas height, read by <CityMap /> */
    --map-h: min(60vh, 34rem);
    /* the plate stays inside the article's gutter at this width */
    --map-bleed: 0px;
  }

  .pick {
    display: flex;
    gap: 0.35rem;
    margin: 0 0 0.6rem;
    max-width: 24rem;
  }
  .pickbtn {
    display: inline-grid;
    place-items: center;
    min-width: 2.2rem;
    height: 2.2rem;
    padding: 0 0.4rem;
    border: 1.5px solid var(--ink);
    background: var(--bg);
    color: var(--ink);
    cursor: pointer;
  }
  .pickbtn:hover {
    background: var(--plate, #fdf5f0);
  }
  .pickbtn :global(svg) {
    display: block;
  }
  .picksel {
    flex: 1;
    min-width: 0;
    height: 2.2rem;
    border: 1.5px solid var(--ink);
    border-radius: 0;
    background: var(--bg);
    color: var(--ink);
    font: 600 0.9rem var(--sans);
    padding: 0 0.5rem;
  }

  .note {
    max-width: var(--measure);
    color: var(--body-soft);
    font-size: 0.94rem;
    line-height: 1.5;
    margin: 1.1rem 0 0;
  }

  /* The panel's one mobile tier. 700px is where the article stops being wide
     enough for the gutter to read as a margin and starts reading as a squeeze:
     below it the map is the only thing on the line, so the plate takes the
     whole screen and the height steps down with it — width and height change
     together, which is the pair that sets how the city sits in the frame.
     The escape is `calc(-1 * var(--gutter))`, the same trick the article's hero
     uses, and deliberately not 100vw: 100vw counts the scrollbar and would push
     the page sideways. */
  @media (max-width: 700px) {
    .mappanel {
      --map-h: min(52svh, 22rem);
      --map-bleed: var(--gutter);
    }
    .note {
      font-size: 0.88rem;
    }
  }
</style>
