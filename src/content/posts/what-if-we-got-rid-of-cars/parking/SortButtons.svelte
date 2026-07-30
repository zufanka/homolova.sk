<script lang="ts">
  /**
   * The ranking's column header, which doubles as its sort control: the city
   * label sits over the names, the green / car labels over the diverging spine,
   * the "No green" label over the third number. Writes `sortKey` and `sortDir`
   * on the view of whichever instrument it is nested in; that instrument's
   * `<Ranking />` reorders on them.
   *
   * Sits directly above `<Ranking />` and shares its five-column grid — the two
   * grids are declared separately because the components are siblings, so
   * `.rank-head` here and `.row` in `Ranking.svelte` must be kept in step, and
   * both narrow down off the one `rankcols` container query. Nothing in either
   * file may narrow on a viewport query: the two conditions would not fire
   * together, and a header cell may not be hidden with `display: none`, which
   * would shift every cell after it a column left. Both mistakes have the same
   * symptom — a label sitting over the wrong numbers.
   */
  import { useView, SORT_DEFAULT_DIR, type SortKey, type SortDir } from './state.svelte';

  const view = useView();

  /** Only read to size the no-green column identically to `<Ranking />` — see
   *  `.rank-head.converted` below. */
  const converted = $derived(view.stateKey === 'scenario');

  const on = (k: SortKey) => view.sortKey === k;

  /** Clicking the active key flips it; any other key arrives in its own default. */
  const nextDir = (k: SortKey): SortDir =>
    on(k) ? (view.sortDir === 'desc' ? 'asc' : 'desc') : SORT_DEFAULT_DIR[k];

  const set = (k: SortKey) => () => {
    const dir = nextDir(k);
    view.sortKey = k;
    view.sortDir = dir;
  };

  /**
   * Each column's two directions in its own terms. The buttons are labelled
   * with what the next click does, not with what is already showing, so the
   * active key's label reads as the reversal it offers.
   */
  const PHRASE: Record<SortKey, Record<SortDir, string>> = {
    city: { asc: 'city name, A to Z', desc: 'city name, Z to A' },
    green: {
      desc: "the median square's green share, largest first",
      asc: "the median square's green share, smallest first"
    },
    car: {
      desc: "the median square's car share, largest first",
      asc: "the median square's car share, smallest first"
    },
    zero: {
      desc: 'the share of residents whose square holds no green, largest first',
      asc: 'the share of residents whose square holds no green, smallest first'
    }
  };
  const action = (k: SortKey) => `Rank by ${PHRASE[k][nextDir(k)]}`;
</script>

<div class="rank-head" class:converted>
  <span></span>
  <button
    type="button"
    class="sortbtn sn"
    class:on={on('city')}
    class:asc={on('city') && view.sortDir === 'asc'}
    aria-pressed={on('city')}
    title={action('city')}
    aria-label={action('city')}
    onclick={set('city')}>City</button
  >
  <span class="rh-bar" role="group" aria-label="Rank the list by">
    <button
      type="button"
      class="sortbtn sg"
      class:on={on('green')}
      class:asc={on('green') && view.sortDir === 'asc'}
      aria-pressed={on('green')}
      title={action('green')}
      aria-label={action('green')}
      onclick={set('green')}>Green</button
    >
    <button
      type="button"
      class="sortbtn sc"
      class:on={on('car')}
      class:asc={on('car') && view.sortDir === 'asc'}
      aria-pressed={on('car')}
      title={action('car')}
      aria-label={action('car')}
      onclick={set('car')}>Car</button
    >
  </span>
  <span class="rh-figs">green / car</span>
  <button
    type="button"
    class="sortbtn sz"
    class:on={on('zero')}
    class:asc={on('zero') && view.sortDir === 'asc'}
    aria-pressed={on('zero')}
    title={action('zero')}
    aria-label={action('zero')}
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
  /* flush left, without the usual side padding, so the label and its underline
     start exactly where the city names in the rows below start */
  .sortbtn.sn {
    justify-self: start;
    padding-left: 0;
    padding-right: 0;
    text-align: left;
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
  .sortbtn.on.sz,
  .sortbtn.on.sn {
    border-bottom-color: var(--ink, #020202);
  }
  /* ▾ = ranked by this column, top of the column first; ▴ = the reverse */
  .sortbtn.on::after {
    content: ' \25BE';
  }
  .sortbtn.on.asc::after {
    content: ' \25B4';
  }

  /* Narrow-column tightening. The template, the gap and the inline padding are
     copied verbatim from `.row` in Ranking.svelte — the two grids are separate
     because the components are siblings, so the only thing keeping a label over
     its own column is that these five values match, character for character.

     One query, and a container query, for both files. Ranking used to narrow on
     `@media (max-width: 640px)` while this file narrowed on the container: a
     viewport query and a container query never fire together, so at any width
     where only one applied the two templates disagreed and every label slid a
     column sideways. There is now a single condition and both grids answer it
     at the same instant.

     The labels shrink with the columns: GREEN gains a ▾ when it is the active
     sort, and at full size the pair would spill out of the bar column into
     "green / car".

     Nothing here may `display: none` a header cell. A hidden grid item is
     removed from the flow, so the cells after it shift one column left — that
     is what used to park NO GREEN over the figures. Use `visibility` if a cell
     ever has to go.

     The fourth and fifth values below are `var()`s, not literals, for one
     further reason particular to this pair: once the converted state drops
     the arrow from NO GREEN, that column no longer needs the room "81%"
     needs, and the freed width is handed to green/car instead. `--figs-w-
     narrow` / `--zero-w-narrow` carry that split; `.rank-head.converted` sets
     them to the same values `.ranking.converted` in Ranking.svelte sets, so
     the two grids narrow the same way whichever state is on screen. Their
     fallbacks are the original literals, so the NOW state — where `.converted`
     is absent and the properties are unset — still gets the width its own
     widest value needs. */
  @container rankcols (max-width: 28rem) {
    .rank-head {
      grid-template-columns:
        1.15rem
        clamp(4.5rem, 20cqi, 5.6rem)
        minmax(0, 1fr)
        var(--figs-w-narrow, clamp(4.7rem, 21cqi, 5.4rem))
        var(--zero-w-narrow, clamp(3.8rem, 17cqi, 4.4rem));
      gap: clamp(0.3rem, 1.3cqi, 0.5rem);
      padding-inline: clamp(0.15rem, 0.7cqi, 0.3rem);
      font-size: 0.62rem;
    }
    .sortbtn {
      font-size: 0.6rem;
      padding: 0.1rem 0.2rem 0.05rem;
    }
    .sortbtn.sn,
    .sortbtn.sz {
      padding-inline: 0;
    }
  }

  /* Values must match `.ranking.converted` in Ranking.svelte character for
     character — see the comment above the container query for why. */
  .rank-head.converted {
    --figs-w-narrow: clamp(6.5rem, 29cqi, 7.5rem);
    --zero-w-narrow: clamp(2rem, 9cqi, 2.3rem);
  }
</style>
