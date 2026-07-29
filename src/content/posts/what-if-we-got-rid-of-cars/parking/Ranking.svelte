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
   * Clicking a row sets `view.slug`, which is what drives the map.
   */
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { view, SORT_DEFAULT_DIR, type SortKey, type SortDir } from './state.svelte';
  import type { CityRow, Metrics } from './types';

  let { rows }: { rows: CityRow[] } = $props();

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
   * Always sorted on the `now` figures, whichever key is active. Converted
   * "no green" is ~0 for every city, so sorting on it would collapse the list
   * into a flat tie; holding green and car to the same rule keeps the order
   * fixed across the switch, so the bars visibly grow in place rather than
   * growing and reshuffling at once.
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
      if (key === 'zero') {
        return (
          b.now.zeroGreen - a.now.zeroGreen ||
          b.now.medCar - a.now.medCar ||
          a.now.medGreen - b.now.medGreen
        );
      }
      if (key === 'green') {
        return b.now.medGreen - a.now.medGreen || b.now.medCar - a.now.medCar;
      }
      return b.now.medCar - a.now.medCar || b.now.medGreen - a.now.medGreen;
    };
    return rows.slice().sort((a, b) => sign * cmp(a, b));
  });

  /**
   * "No green" collapses to ~0 for every city once the asphalt is planted —
   * every inhabited square holds some street or parking, so every square gains
   * something. The endpoint carries no information; the drop does.
   */
  function zeroText(c: CityRow): string {
    const now = Math.round(c.now.zeroGreen);
    return converted ? `${now}% → ${Math.round(c.scenario.zeroGreen)}%` : `${now}%`;
  }

  /**
   * The bar is decorative and the two figures are dropped below 640 px, so the
   * whole row is named for assistive tech instead of read cell by cell.
   */
  function rowLabel(c: CityRow, i: number): string {
    const m = metrics(c);
    return (
      `${i + 1}. ${c.city}. Green ${fmt1(m.medGreen)}% of the median square's land, ` +
      `car infrastructure ${fmt1(m.medCar)}%. No green: ${zeroText(c)} of residents.` +
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

<div class="ranking">
  <p class="sr-only" role="status">{status}</p>

  <ol class="rank" aria-label="European capitals, ranked">
    {#each ordered as c, i (c.slug)}
      {@const m = metrics(c)}
      <li animate:flip={flipArgs}>
        <button
          type="button"
          class="row"
          class:active={view.slug === c.slug}
          aria-pressed={view.slug === c.slug}
          aria-label={rowLabel(c, i)}
          onclick={() => (view.slug = c.slug)}
        >
          <span class="rk">{i + 1}</span>
          <span class="city">{c.city}</span>
          <span class="bar" aria-hidden="true">
            <span class="seg parks" style:width="{(m.medGreen / scale) * 100}%"></span>
            <span class="seg car" style:width="{(m.medCar / scale) * 100}%"></span>
          </span>
          <span class="figs" aria-hidden="true">
            {#if c.thin || c.sparse}
              <span class="flagged" title="Parking is under-mapped here; the car figure is a floor"
                >†</span
              >
            {/if}
            <span class="ha park-ha">{fmt1(m.medGreen)}%</span>
            <span class="sep">/</span>
            <span class="ha car-ha">{fmt1(m.medCar)}%</span>
          </span>
          <span class="zero" aria-hidden="true">{zeroText(c)}</span>
        </button>
      </li>
    {/each}
  </ol>
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

  .rank {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rank li + li {
    margin-top: 3px;
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
  .city {
    font-weight: 600;
    font-size: 0.9rem;
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
  .flagged {
    font-weight: 700;
    color: var(--muted, #666);
    cursor: help;
    font-size: 0.75rem;
    margin-right: 0.1rem;
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

  /* Between the 900 px stack point and a roomy desktop the list column is only
     ~23rem wide, and the four fixed columns would eat all of it — the spine
     would render at zero width. Tighten them so the bar always has room.
     Keep in step with the same query in SortButtons.svelte. */
  @media (min-width: 900px) and (max-width: 1200px) {
    .row {
      grid-template-columns: 1.2rem 5.4rem minmax(0, 1fr) 5.2rem 4.2rem;
      gap: 0.45rem;
    }
    .city {
      font-size: 0.82rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .figs,
    .zero {
      font-size: 0.75rem;
    }
    .ha {
      min-width: 2rem;
    }
  }

  @media (max-width: 640px) {
    /* no room for both number columns: the spine already carries green vs car,
       so their figures drop and only the no-green share stays as text. The
       column itself survives, narrowed, so the † flag keeps its place. */
    .row {
      grid-template-columns: 1.1rem 4.9rem minmax(0, 1fr) 0.9rem 3.2rem;
      gap: 0.4rem;
      padding: 0.3rem 0.15rem;
    }
    .figs {
      gap: 0;
    }
    .figs .ha,
    .figs .sep {
      display: none;
    }
    .city {
      line-height: 1.2;
      font-size: 0.8rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .rk {
      font-size: 0.68rem;
    }
    .zero {
      font-size: 0.72rem;
    }
    .ha {
      min-width: 1.9rem;
    }
    .flagged {
      font-size: 0.65rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .seg {
      transition: none;
    }
  }
</style>
