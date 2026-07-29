<script lang="ts">
  /**
   * The ranking's column header, which doubles as its sort control: the green /
   * car labels sit over the diverging spine, the "No green" label over the third
   * number. Writes `view.sortKey`; `Ranking.svelte` reorders on it.
   *
   * Sits directly above `<Ranking />` and shares its five-column grid — the two
   * grids are declared separately because the components are siblings, so
   * `.rank-head` here and `.row` in `Ranking.svelte` must be kept in step.
   */
  import { view, type SortKey } from './state.svelte';

  const set = (k: SortKey) => () => (view.sortKey = k);
</script>

<div class="rank-head">
  <span></span>
  <span></span>
  <span class="rh-bar" role="group" aria-label="Rank the list by">
    <button
      type="button"
      class="sortbtn sg"
      class:on={view.sortKey === 'green'}
      aria-pressed={view.sortKey === 'green'}
      title="Rank by the median square's green share, largest first"
      aria-label="Rank by the median square's green share, largest first"
      onclick={set('green')}>Green</button
    >
    <button
      type="button"
      class="sortbtn sc"
      class:on={view.sortKey === 'car'}
      aria-pressed={view.sortKey === 'car'}
      title="Rank by the median square's car share, largest first"
      aria-label="Rank by the median square's car share, largest first"
      onclick={set('car')}>Car</button
    >
  </span>
  <span class="rh-figs">green / car</span>
  <button
    type="button"
    class="sortbtn sz"
    class:on={view.sortKey === 'zero'}
    aria-pressed={view.sortKey === 'zero'}
    title="Rank by the share of residents whose square holds no green, largest first"
    aria-label="Rank by the share of residents whose square holds no green, largest first"
    onclick={set('zero')}>No green</button
  >
</div>

<style>
  /* keep the columns and gap in sync with `.row` in Ranking.svelte */
  .rank-head {
    display: grid;
    grid-template-columns: 1.4rem 6.6rem minmax(0, 1fr) 6rem 5.4rem;
    align-items: end;
    gap: 0.7rem;
    padding: 0 0.3rem 0.35rem;
    font-family: var(--sans, system-ui, sans-serif);
    font-size: 0.72rem;
    color: var(--muted, #666);
  }
  /* the two spine labels share the bar column, mirrored around its centre */
  .rh-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .rh-figs {
    text-align: right;
    white-space: nowrap;
  }
  .sortbtn {
    font: inherit;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background: none;
    border: 0;
    cursor: pointer;
    padding: 0.1rem 0.35rem 0.05rem;
    border-bottom: 3px solid transparent;
    color: var(--muted, #666);
    white-space: nowrap;
  }
  .sortbtn.sg {
    justify-self: end;
  }
  .sortbtn.sc {
    justify-self: start;
  }
  .sortbtn.sz {
    justify-self: end;
    padding-right: 0;
    text-align: right;
    white-space: normal;
  }
  .sortbtn:hover {
    color: var(--ink, #020202);
  }
  .sortbtn.on {
    color: var(--ink, #020202);
  }
  .sortbtn.on.sg {
    border-bottom-color: var(--pk-park, #0a6b40);
  }
  .sortbtn.on.sc {
    border-bottom-color: var(--pk-asphalt, #7d4a9e);
  }
  .sortbtn.on.sz {
    border-bottom-color: var(--ink, #020202);
  }
  /* ▾ = ranked by this column, largest first */
  .sortbtn.on::after {
    content: ' \25BE';
  }

  @media (max-width: 640px) {
    /* the figures column loses its numbers but keeps a slot for the † flag */
    .rank-head {
      grid-template-columns: 1.1rem 4.9rem minmax(0, 1fr) 0.9rem 3.2rem;
      gap: 0.4rem;
      padding: 0 0.15rem 0.3rem;
      font-size: 0.62rem;
    }
    .rh-figs {
      display: none;
    }
    .sortbtn {
      font-size: 0.62rem;
      padding: 0.1rem 0.2rem 0.05rem;
      border-bottom-width: 2px;
    }
  }
</style>
