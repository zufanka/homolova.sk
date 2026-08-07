<script lang="ts">
  /**
   * The map on its own. No ranking beside it any more, so the reader picks a
   * city from the map's own title instead of from a list of rows.
   *
   * The picker is three controls — prev, a native select, next — rather than a
   * new kind of widget: native select gets scrolling, type-ahead and keyboard
   * for free, and 39 options do not need more than that.
   *
   * The select *is* the map's title. It carries the display face the map's old
   * `<h3>` carried, because a heading saying "Prague" above a dropdown also
   * saying "Prague" printed the same word twice and only one of them answered
   * when you pressed it. Reading which city you are on and choosing a different
   * one are now the same object.
   *
   * Its own instrument: it creates the view its map, heat key and state toggle
   * read, so the rankings further up the article cannot move it.
   *
   * Panel chrome — the picker, NOW/CONVERTED and HEAT ISLAND — is everything a reader
   * *chooses*: it sits above the plate, in the panel's own margins, never over
   * the city. The one control that stays on the map is RESET, which is not a
   * choice but a way back out of a zoom the reader made on the map itself.
   *
   * Layout contract with `<CityMap />`: this panel owns the map's dimensions
   * and publishes them as custom properties — `--map-h` for the canvas height,
   * `--map-bleed` for how far the plate may reach past the article's gutter —
   * so nothing inside the map has to measure the viewport.
   */
  import CityMap from './CityMap.svelte';
  import StateToggle from './StateToggle.svelte';
  import { createView, provideView } from './state.svelte';
  import type { CityRow } from './types';

  let { rows }: { rows: CityRow[] } = $props();

  /** Alphabetical: the select is a lookup, not a ranking. `<CityMap />` also
   *  steps prev / next and prefetches neighbours in the order it is handed, so
   *  the arrows walk the same order the list shows. */
  const ordered = $derived([...rows].sort((a, b) => a.city.localeCompare(b.city)));

  const view = provideView(createView({ slug: 'prague' }));

  /** The panel needs the row for the same reason the map does: the sub-line
   *  under the title and whether HEAT ISLAND has anything to show are both
   *  properties of the chosen city, and both controls live out here now. */
  const selected = $derived(ordered.find((c) => c.slug === view.slug) ?? ordered[0]);
  const sub = $derived(
    selected.country +
      (selected.popShare
        ? ` · urban core, home to ${Math.round(selected.popShare)}% of the city’s residents`
        : '')
  );
  /** `view.heat` survives a move to a city with no model, so the button's own
   *  state has to be read through the model's availability — otherwise it would
   *  sit pressed and disabled while nothing is drawn. */
  const heatOn = $derived(view.heat && selected.uhi);

  /**
   * The city name, spoken *only* when an arrow moved it.
   *
   * The title used to be an `<h3 aria-live="polite">`, which announced every
   * change. A `<select>` already announces its own value, so keeping a live
   * region on the title would say the city twice for the one path that never
   * needed help. The path that does need it is the steppers: they leave focus
   * on the button, so the select changes silently for a screen reader and the
   * arrows would be two buttons with no observable effect.
   *
   * Hence a status region the arrows write and the select clears — clearing on
   * select means the next arrow press is always a change to this text, even
   * when it lands back on the city the last arrow press announced.
   */
  let stepped = $state('');

  function step(d: number): void {
    const i = ordered.findIndex((c) => c.slug === view.slug);
    const n = ordered.length;
    const next = ordered[(((i + d) % n) + n) % n];
    view.slug = next.slug;
    stepped = next.city;
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
      onchange={(e) => {
        view.slug = e.currentTarget.value;
        stepped = '';
      }}
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
  <p class="mapsub">{sub}</p>
  <p class="sr-only" role="status">{stepped}</p>

  <div class="chrome">
    <StateToggle />
    <!-- Same tier as NOW / CONVERTED, and deliberately the same shape: both are
         things the reader turns on, so neither belongs on top of the city. The
         pressed state is an ink fill, not a hue, and `aria-pressed` carries it
         for anyone the fill does not reach. Disabled when the city is outside
         the UrbClim coverage; the label says so rather than leaving a dead
         button to be guessed at. -->
    <button
      type="button"
      class="heatbtn"
      class:on={heatOn}
      disabled={!selected.uhi}
      aria-pressed={heatOn}
      aria-label={selected.uhi
        ? 'Summer heat island overlay'
        : `No summer heat island model for ${selected.city}`}
      title={selected.uhi
        ? 'Summer urban heat island, modelled °C above the rural surroundings'
        : 'No heat-island model for this city'}
      onclick={() => (view.heat = !view.heat)}>Heat island</button
    >
  </div>

  <CityMap rows={ordered} />
</section>

<style>
  .mappanel {
    max-width: 52rem;
    margin-inline: auto;
    /* the map's canvas height, read by <CityMap /> */
    --map-h: min(60vh, 34rem);
    /* the plate stays inside the article's gutter at this width */
    --map-bleed: 0px;
    /* HEAT ISLAND's own hue, read off the ramp `<HeatLegend />` paints under the
       map (`#c7795c`, its hottest stop) so the button is tinted with the thing
       it turns on. Darkened from that literal swatch: the ramp is a background
       fill with no text sitting on it, and the stop itself clears only ~3:1
       against white — this shade holds ~4.7:1 both as text on `--bg` and as
       `--bg` text on itself, so the on/off value-inversion (fill vs. border only)
       stays legible at either end. Never `--pk-park` green or `--pk-asphalt`
       purple — those already mean green space and car infrastructure here. */
    --pk-heat: #b35a3a;
    --pk-heat-hover: #8a3f27;
  }

  /* The title. The select shares the row with its two steppers and stretches to
     fill it, so the arrows never move as the name under them changes length. */
  .pick {
    display: flex;
    align-items: stretch;
    gap: 0.35rem;
    margin: 0;
    max-width: 24rem;
  }
  .pickbtn {
    display: inline-grid;
    place-items: center;
    min-width: 2.2rem;
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
  /* Set in the display face at the size the map's `<h3>` used to be: this is
     the heading, and it has to read as one before it reads as a control. The
     native chevron is left alone on purpose — it is the only part of a select
     that says "there are more of these", and this piece does not build custom
     dropdowns. */
  .picksel {
    flex: 1;
    min-width: 0;
    border: 1.5px solid var(--ink);
    border-radius: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: var(--display);
    font-size: 1.3rem;
    line-height: 1.1;
    padding: 0.35rem 0.4rem;
  }
  /* The site's global focus ring covers a, button, input and textarea, but not
     select — so this control would otherwise keep only the UA default. */
  .picksel:focus-visible {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }

  .mapsub {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0.25rem 0 0;
  }

  /* NOW / CONVERTED and HEAT ISLAND, on one line, opposite ends of it: the
     state toggle stays where a reader's eye meets the row first, and HEAT
     ISLAND — a second, unrelated kind of choice, not a third state of the
     first one — sits apart from it rather than queued right after it.
     `<StateToggle />` carries its own 0.7rem bottom margin, so the button
     matches it rather than the row setting a margin the toggle would add to. */
  .chrome {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.4rem;
    margin-top: 0.7rem;
  }
  .heatbtn {
    font-family: var(--sans);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.3rem 0.6rem;
    border: 1.5px solid var(--pk-heat);
    background: var(--bg);
    color: var(--pk-heat);
    cursor: pointer;
    /* the auto left margin, not `justify-content` on `.chrome`, is what pins
       this to the right: it keeps pinning to the row's right edge even when
       `.chrome` wraps the button onto a line of its own, so a phone narrow
       enough to force that wrap still reads as a deliberate two-line layout
       rather than the button drifting back to the left with nothing beside it. */
    margin: 0 0 0.7rem auto;
  }
  .heatbtn:hover:not(:disabled) {
    color: var(--pk-heat-hover);
  }
  /* Pressed = filled, exactly the value-inversion `<StateToggle />` uses for
     NOW/CONVERTED, just carried in this button's own hue instead of ink — so
     on/off stays legible without hue being the only thing that tells the two
     states apart. */
  .heatbtn.on,
  .heatbtn.on:hover {
    background: var(--pk-heat);
    color: var(--bg);
  }
  .heatbtn:disabled {
    color: var(--muted);
    border-color: #bbb;
    cursor: default;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
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
  }

  /* The title steps down with the rest of the map's type, and the country line
     goes: on a phone the panel's own chrome is three controls deep already, and
     the city and its country are both stated again in the article around it. */
  @media (max-width: 899px) {
    .picksel {
      font-size: 1.15rem;
    }
    .mapsub {
      display: none;
    }
  }
</style>
