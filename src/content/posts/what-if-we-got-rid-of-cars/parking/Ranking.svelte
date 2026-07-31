<script lang="ts">
  /**
   * The ranked list of capitals: one diverging-spine chart, two states, four
   * sort keys, each sortable both ways. Sits under `<SortButtons />`, which is
   * its column header and its sort control, and under `<StateToggle />`, which
   * switches the state.
   *
   * The bar lengths always encode the same thing — each core's
   * population-weighted median 500 m square: green grows left from the central
   * axis, car infrastructure grows right, both as a share of that square's
   * land. The state (now / converted) changes the values, not the units, so the
   * scale spans BOTH states and every city: switching to converted grows the
   * green bars instead of silently rescaling the axis under them.
   *
   * Clicking a row sets `slug` on its instrument's view, which is what drives
   * the map when one is nested in the same instrument.
   */
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { useView, SORT_DEFAULT_DIR, type SortKey, type SortDir } from './state.svelte';
  import type { CityRow, Metrics } from './types';

  let {
    rows,
    /**
     * Marks rows a step is talking about. Structural, not a third hue: an ink
     * rule down the row's leading edge plus the plate wash, because green and
     * purple already mean green and car here. Also spoken, so the emphasis is
     * not colour-only or sight-only.
     */
    highlight = null,
    /**
     * Row heights come from `--rank-row` instead of the type, so a layout that
     * has to fit all 39 capitals on one screen can hand down the height it can
     * afford. See `<ScrollyRanking />`, which computes it from the viewport.
     */
    compact = false
  }: {
    rows: CityRow[];
    highlight?: ((c: CityRow) => boolean) | null;
    compact?: boolean;
  } = $props();

  const view = useView();

  const fmt1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString('en-GB');

  const converted = $derived(view.stateKey === 'scenario');
  const metrics = (c: CityRow): Metrics => (converted ? c.scenario : c.now);

  /** One scale for every row and both states: the largest single value anywhere. */
  const scale = $derived(
    rows.reduce(
      (m, c) => Math.max(m, c.now.medGreen, c.now.medCar, c.scenario.medGreen, c.scenario.medCar),
      0
    ) || 1
  );

  /**
   * Sorted on whichever state is on screen — `metrics()` already picks `now`
   * vs `scenario` for the bars and figures below, so the comparator has to
   * read through the same function or the list order stops matching what it
   * displays the moment CONVERTED is active.
   *
   * Each comparator is written in its key's default direction; the other
   * direction is that same comparator negated, which carries the tie-breakers
   * with it so the reversed list is an exact mirror rather than a re-sort.
   */
  const ordered = $derived.by(() => {
    const key = view.sortKey;
    const sign = view.sortDir === SORT_DEFAULT_DIR[key] ? 1 : -1;
    const cmp = (a: CityRow, b: CityRow) => {
      if (key === 'city') {
        return a.city.localeCompare(b.city);
      }
      const ma = metrics(a);
      const mb = metrics(b);
      if (key === 'zero') {
        return mb.zeroGreen - ma.zeroGreen || mb.medCar - ma.medCar || ma.medGreen - mb.medGreen;
      }
      if (key === 'green') {
        return mb.medGreen - ma.medGreen || mb.medCar - ma.medCar;
      }
      return mb.medCar - ma.medCar || mb.medGreen - ma.medGreen;
    };
    return rows.slice().sort((a, b) => sign * cmp(a, b));
  });

  /**
   * "No green" collapses to ~0 for every city once the asphalt is planted —
   * every inhabited square holds some street or parking, so every square gains
   * something. Showing the drop as well (`13% → 0%`) repeated what the bar and
   * the figures beside it already show; once every row converges on the same
   * one or two values, the only thing left worth a reader's attention is where
   * each city lands, not how far it fell.
   */
  function zeroText(c: CityRow): string {
    const value = converted ? c.scenario.zeroGreen : c.now.zeroGreen;
    return `${Math.round(value)}%`;
  }

  /**
   * The bar is decorative and the figures are terse, so the whole row is named
   * for assistive tech instead of read cell by cell. This is also the only
   * place the † marker beside a city name is spelled out in words, so the
   * sentence it appends has to stay.
   */
  function rowLabel(c: CityRow, i: number): string {
    const m = metrics(c);
    return (
      `${i + 1}. ${c.city}. Green ${fmt1(m.medGreen)}% of the median square's land, ` +
      `car infrastructure ${fmt1(m.medCar)}%. No green: ${zeroText(c)} of residents.` +
      (highlight?.(c) ? ' Highlighted by the passage alongside.' : '') +
      (c.thin || c.sparse ? ' Parking is under-mapped here; the car figure is a floor.' : '')
    );
  }

  /** Each key names itself and both of its directions, so the spoken status can
   *  be assembled from the state alone. */
  const SORT_NAME: Record<SortKey, { of: string } & Record<SortDir, string>> = {
    zero: { of: 'no green', desc: 'largest first', asc: 'smallest first' },
    green: { of: 'green', desc: 'largest first', asc: 'smallest first' },
    car: { of: 'car infrastructure', desc: 'largest first', asc: 'smallest first' },
    city: { of: 'city name', desc: 'Z to A', asc: 'A to Z' }
  };
  const status = $derived(
    `Ranked by ${SORT_NAME[view.sortKey].of}, ${SORT_NAME[view.sortKey][view.sortDir]}. ` +
      (converted ? 'Showing the converted scenario.' : 'Showing the cities as measured.')
  );

  // the hand-rolled measure/reorder/transform FLIP of the prototype
  const flipArgs = $derived({
    duration: prefersReducedMotion.current ? 0 : 380,
    easing: cubicOut
  });
</script>

<div class="ranking" class:compact class:converted>
  <p class="sr-only" role="status">{status}</p>

  <ol class="rank" aria-label="European capitals, ranked">
    {#each ordered as c, i (c.slug)}
      {@const m = metrics(c)}
      <li animate:flip={flipArgs}>
        <button
          type="button"
          class="row"
          class:flag={highlight?.(c)}
          class:active={view.slug === c.slug}
          aria-pressed={view.slug === c.slug}
          aria-label={rowLabel(c, i)}
          onclick={() => (view.slug = c.slug)}
        >
          <span class="rk">{i + 1}</span>
          <!-- The under-mapping marker qualifies the city, so it sits with the
               name rather than in a column of its own — that column's width is
               what pays for the two figures on a phone. -->
          <span class="city">
            <span class="cityname">{c.city}</span>
            {#if c.thin || c.sparse}<span
                class="flagged"
                title="Parking is under-mapped here; the car figure is a floor">†</span
              >{/if}
          </span>
          <span class="bar" aria-hidden="true">
            <span class="seg parks" style:width="{(m.medGreen / scale) * 100}%"></span>
            <span class="seg car" style:width="{(m.medCar / scale) * 100}%"></span>
          </span>
          <span class="figs" aria-hidden="true">
            <span class="ha park-ha">{fmt1(m.medGreen)}%</span>
            <span class="sep">/</span>
            <span class="ha car-ha">{fmt1(m.medCar)}%</span>
          </span>
          <span class="zero" aria-hidden="true">{zeroText(c)}</span>
        </button>
      </li>
    {/each}
  </ol>

  <!-- The dagger marks particular rows, so the note belongs to the rows rather
       than to whichever layout happens to wrap them — it travels with the
       ranking into every frame that renders one. -->
  <p class="axis-note">Source: OpenStreetMap. † = parking under-mapped in OpenStreetMap.</p>
</div>

<style>
  .ranking {
    /* piece-local palette, namespaced so nothing leaks into the site's own
       custom properties. Ink, greys and fonts come from the site. */
    --pk-park: #0a6b40;
    --pk-asphalt: #7d4a9e;
    --pk-plate: var(--card, #fdf5f0);
    font-family: var(--sans, system-ui, sans-serif);
  }

  /* The list is never a scroll container and never has a height imposed on it.
     Two separate things go wrong when it is:

     - On a touch screen it traps the scroll. A finger landing on the bars
       scrolls the list, the page does not advance, and the reader is stuck
       inside a pinned sequence with nothing to say why. `overscroll-behavior`
       only fixes the two ends of that, not the middle.
     - Left uncapped but set to `auto` it invents a scrollbar: sub-pixel row
       heights alone leave a pixel or two of overflow across 39 rows, which
       `auto` answers with a permanent ~15px bar on a list that fits.

     A layout that cannot show every row (a phone held sideways) shrinks its
     rows instead, and lets the rest run past the foot of the screen — see the
     comment over `.viz` in ScrollyRanking.svelte. */
  .rank {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rank li + li {
    margin-top: 3px;
  }
  .compact .rank li + li {
    margin-top: 0;
  }

  .axis-note {
    max-width: var(--measure);
    margin: 0.9rem 0 0;
    font-size: 0.83rem;
    line-height: 1.5;
    color: var(--muted);
  }
  .compact .axis-note {
    margin-top: 0.5rem;
    font-size: 0.72rem;
  }

  /* keep the columns and gap in sync with `.rank-head` in SortButtons.svelte */
  .row {
    display: grid;
    grid-template-columns: 1.4rem 6.6rem minmax(0, 1fr) 6rem 5.4rem;
    align-items: center;
    gap: 0.7rem;
    width: 100%;
    background: none;
    border: 0;
    padding: 0.28rem 0.3rem;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row:hover {
    background: var(--pk-plate);
  }
  .row.active {
    background: var(--pk-plate);
    outline: 1.5px solid var(--ink, #020202);
  }
  /* the step's emphasis: an ink rule down the leading edge and the plate wash.
     No new hue — green and purple are already spoken for as green and car, and
     a third colour would read as a third data category. */
  .row.flag {
    background: var(--pk-plate);
    box-shadow: inset 3px 0 0 var(--ink, #020202);
  }
  /* Compact rows are sized by the room the layout has, not by their type: the
     scrolly frames must hold all 39 capitals inside one viewport, so the row
     height is the layout's --rank-row and the bar fills it bar a hairline gap.
     Type stays at the sizes the phone layout already uses, which clear the
     shortest row --rank-row can produce. */
  .compact .row {
    height: var(--rank-row, 1.35rem);
    padding: 0 0.3rem;
  }
  .compact .bar {
    height: calc(var(--rank-row, 1.35rem) - 3px);
  }
  /* Every cell is set solid here. The inherited 1.5 line height would give each
     one a line box half again its type size — taller than --rank-row itself at
     phone sizes — and a row with a fixed height answers that by letting the box
     hang out of both ends of itself. The glyphs fit; only the leading did not. */
  .compact .city,
  .compact .rk,
  .compact .figs,
  .compact .zero {
    line-height: 1;
  }
  .compact .city {
    font-size: 0.8rem;
  }
  .compact .rk {
    font-size: 0.68rem;
  }
  .compact .figs,
  .compact .zero {
    font-size: 0.74rem;
  }
  /* a fixed-height row cannot absorb a wrap, so this one may not have one */
  .compact .zero {
    white-space: nowrap;
  }
  .row:focus-visible {
    outline: 3px solid var(--ink, #020202);
    outline-offset: -3px;
  }
  .rk {
    font-size: 0.75rem;
    color: var(--muted, #666);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  /* name plus its optional † marker. Flex rather than plain inline text so the
     marker reserves its own width: when a name is too long for the column the
     name ellipsises and the † still reads, instead of the two fighting over the
     same clipped box. */
  .city {
    display: flex;
    align-items: baseline;
    gap: 0.14rem;
    min-width: 0;
    font-weight: 600;
    font-size: 0.9rem;
  }
  .cityname {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* diverging spine: a fixed central ink axis; green grows left, car grows
     right, both on the one shared scale so lengths compare down the list */
  .bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    position: relative;
    height: 1.3rem;
  }
  .seg {
    display: block;
    height: 100%;
    min-width: 1px;
    transition: width 320ms ease;
  }
  .seg.parks {
    grid-column: 1;
    justify-self: end;
    background: var(--pk-park);
  }
  .seg.car {
    grid-column: 2;
    background: var(--pk-asphalt);
  }
  .bar::after {
    content: '';
    position: absolute;
    left: 50%;
    top: -5px;
    bottom: -5px;
    width: 1.5px;
    margin-left: -0.75px;
    background: var(--ink, #020202);
  }

  .figs {
    display: flex;
    align-items: baseline;
    gap: 0.28rem;
    font-variant-numeric: tabular-nums;
    font-size: 0.8rem;
    justify-content: flex-end;
  }
  /* the third number: residents whose 500 m square holds no green at all */
  .zero {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--body, #222);
  }
  .ha {
    min-width: 2.3rem;
    text-align: right;
  }
  .park-ha {
    color: var(--pk-park);
    font-weight: 600;
  }
  .car-ha {
    color: var(--pk-asphalt);
    font-weight: 600;
  }
  .sep {
    color: var(--muted, #666);
  }
  /* Sized off the name it follows (em, not rem), so it rides every tier's type
     scale without a rule of its own. The hover title is for a mouse; the row's
     aria-label carries the same sentence for assistive tech, and `.axis-note`
     under the list states it for everyone. */
  .flagged {
    flex: none;
    font-weight: 700;
    color: var(--muted, #666);
    cursor: help;
    font-size: 0.85em;
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

  /*
   * Narrow frames: Board's ~23rem side column and a phone-width scrolly, where
   * the four fixed columns would otherwise eat the width the diverging spine
   * needs. Both figures stay — the bars answer "which is bigger", the numbers
   * answer "by how much", and the second question is the one the article keeps
   * asking. Removing the dagger's own column is what paid for them; it now
   * rides beside the city name.
   *
   * The fixed columns scale with the container between the two ends rather than
   * stepping, so there is one narrow tier instead of a phone tier under a
   * column tier: at ~21rem the spine still gets ~90px, and at 28rem the type
   * has not been locked to phone size for the whole range.
   *
   * Keyed off the `rankcols` container the layout declares, never the viewport.
   * The same ranking renders in a ~23rem column, a ~52rem scrolly frame and
   * whatever a phone hands it, so window width stopped describing the room the
   * columns have. `.rank-head` in SortButtons.svelte narrows off this identical
   * query: a viewport query on one side and a container query on the other
   * cannot fire together, and every width where only one of them applied put
   * the header labels over the wrong columns.
   *
   * The rules are written `.ranking .x`, not `.x`, so they outrank the
   * `.compact` type sizes above — those are two-class selectors, and a bare
   * `.x` here would lose to them on every compact row, which is every row a
   * scrolly renders.
   *
   * The no-green column is sized for the NOW state's widest content, a bare
   * percentage up to "81%" — that literal is the column's fifth (last) value
   * below and is never conditional, because NOW still renders in this column
   * every time a reader is looking at the NOW state, regardless of viewport.
   *
   * The converted state no longer needs that room: without the arrow it shows
   * only its own value, "0%" almost everywhere and "1%" at most. The width
   * the arrow used to need is handed to the figures column instead, through
   * --figs-w-narrow / --zero-w-narrow below, set only by `.converted` so the
   * NOW-state fallbacks (the original literals) are what apply otherwise. The
   * two are sized so their sum is constant across both states — the 1fr bar
   * column does not change size when the state toggles, only the split
   * between its two fixed neighbours does. `.rank-head` in SortButtons.svelte
   * declares both properties and the class that sets them with the same
   * values, for the same reason the rest of this template must match it
   * character for character.
   */
  .ranking.converted {
    --figs-w-narrow: clamp(6.5rem, 29cqi, 7.5rem);
    --zero-w-narrow: clamp(2rem, 9cqi, 2.3rem);
  }
  @container rankcols (max-width: 28rem) {
    .ranking .row {
      grid-template-columns:
        1.15rem
        clamp(4.5rem, 20cqi, 5.6rem)
        minmax(0, 1fr)
        var(--figs-w-narrow, clamp(4.7rem, 21cqi, 5.4rem))
        var(--zero-w-narrow, clamp(3.8rem, 17cqi, 4.4rem));
      gap: clamp(0.3rem, 1.3cqi, 0.5rem);
      padding-inline: clamp(0.15rem, 0.7cqi, 0.3rem);
    }
    .ranking .city {
      font-size: clamp(0.76rem, 3.4cqi, 0.82rem);
    }
    .ranking .rk {
      font-size: 0.66rem;
    }
    .ranking .figs,
    .ranking .zero {
      font-size: clamp(0.68rem, 3cqi, 0.75rem);
    }
    .ranking .figs {
      gap: 0.16rem;
    }
    .ranking .ha {
      min-width: 1.9rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .seg {
      transition: none;
    }
  }
</style>
