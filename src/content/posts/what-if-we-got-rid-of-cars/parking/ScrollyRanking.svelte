<script lang="ts">
  /**
   * A ranking the scroll walks through: the chart pins near the top of the
   * viewport, and each step's sentence pins to the bottom for as long as that
   * step's block is passing.
   *
   * Progressive enhancement over a document, not a replacement for one. Every
   * step's sentence is a real block in document order and the chart renders
   * whole, so with no JS the section reads as prose over a complete chart.
   * `enhanced` — set in `onMount`, so it is false during the static prerender —
   * only switches on the one-sentence-at-a-time fade. Inactive sentences go to
   * `opacity: 0` and are never `aria-hidden` or `display: none`, so a screen
   * reader still walks all of them in order.
   *
   * The step is the unit of control:
   *
   *   - Entering a step writes its sort onto the view. That is the *only* place
   *     the scroll writes, so a click on the sort header or the state toggle
   *     stands until the next boundary — no override bookkeeping needed, the
   *     guard in `claim()` is the whole mechanism.
   *   - The steps are ordinary blocks in flow, so scrolling back up re-enters
   *     the earlier one and re-claims its sort. The sequence is reversible.
   *   - Nothing here calls `focus()` or `scrollTo()`. `IntersectionObserver`
   *     reads; the page scrolls itself.
   *
   * Layout contract, the same shape as Board's `--map-h`: this component owns
   * the dimensions and publishes them, the children read them. `--rank-row` is
   * the row height, `--rank-h` the short-viewport ceiling, and `rankcols` the
   * container the sort header and the rows narrow off.
   */
  import { onMount, untrack } from 'svelte';
  import Ranking from './Ranking.svelte';
  import SortButtons from './SortButtons.svelte';
  import StateToggle from './StateToggle.svelte';
  import { createView, provideView, SORT_DEFAULT_DIR, type StateKey } from './state.svelte';
  import type { CityRow, ScrollyStep } from './types';

  let {
    rows,
    steps,
    /** Names the section for assistive tech; the sentences are its content. */
    label,
    /** Which state the ranking opens in. Steps never touch it — see below. */
    stateKey = 'now',
    /** Show NOW / CONVERTED. Off for a sequence that is about one state only. */
    stateToggle = false
  }: {
    rows: CityRow[];
    steps: ScrollyStep[];
    label: string;
    stateKey?: StateKey;
    stateToggle?: boolean;
  } = $props();

  let active = $state(0);
  let enhanced = $state(false);
  let markEls = $state<HTMLElement[]>([]);
  let stepEls = $state<HTMLElement[]>([]);
  /** Whether the *active* step's caption is hidden. One flag, not one per step,
   *  because only the active caption is ever visible to dismiss in the first
   *  place — reset alongside `active` in `claim()` is what makes it clear
   *  again on every boundary crossing, forward or back. */
  let dismissed = $state(false);

  // `untrack` because these are opening values on purpose: the view owns the
  // sort from here on, and `claim()` is the only thing that rewrites it.
  const view = provideView(
    untrack(() =>
      createView({
        stateKey,
        sortKey: steps[0].sortKey,
        sortDir: steps[0].sortDir ?? SORT_DEFAULT_DIR[steps[0].sortKey]
      })
    )
  );

  function claim(i: number): void {
    if (i === active) return;
    active = i;
    dismissed = false;
    view.sortKey = steps[i].sortKey;
    view.sortDir = steps[i].sortDir ?? SORT_DEFAULT_DIR[steps[i].sortKey];
  }

  function dismissCaption(): void {
    dismissed = true;
    // The button that was just clicked is about to disappear (see markup)
    // and the caption fades under it; left alone the browser drops focus to
    // <body>. The step's own <li> is already where the reader is scrolled to,
    // so landing there keeps focus in place instead of at the document top.
    stepEls[active]?.focus();
  }

  onMount(() => {
    enhanced = true;
    /**
     * Which step's sentence is pinned right now, read off geometry rather than
     * guessed at.
     *
     * Each step carries a zero-size marker at the offset the stylesheet pins its
     * sentence to, and the step to follow is simply the one whose marker is on
     * screen. That keeps the trigger and the CSS pin in the same units — move
     * the pin and the trigger moves with it — instead of tuning a rootMargin
     * against them by hand. The steps tile the scroll axis, so the watches abut
     * exactly and reading back up re-enters the previous one.
     *
     * Steps are a viewport tall, so normally one marker is in view. Two can be
     * when the visible viewport is taller than `svh` (a retracted phone
     * toolbar); the later one wins, which is the one arriving.
     */
    const inView = new Array<boolean>(steps.length).fill(false);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        inView[Number((e.target as HTMLElement).dataset.step)] = e.isIntersecting;
      }
      for (let i = inView.length - 1; i >= 0; i--) {
        if (inView[i]) {
          claim(i);
          return;
        }
      }
    });
    for (const el of markEls) if (el) io.observe(el);
    return () => io.disconnect();
  });
</script>

<section class="scrolly" class:js={enhanced} aria-label={label}>
  <div class="viz" class:withtoggle={stateToggle} style:--rank-n={rows.length}>
    {#if stateToggle}<StateToggle />{/if}
    <div class="rankwrap">
      <SortButtons />
      <Ranking {rows} compact highlight={steps[active].highlight ?? null} />
    </div>
  </div>

  <ol class="steps">
    {#each steps as s, i (i)}
      <li class="step" class:on={i === active} tabindex="-1" bind:this={stepEls[i]}>
        <span class="mark" data-step={i} bind:this={markEls[i]}></span>
        <!-- The sentences are the article's own prose, written a few lines from
             here in index.svx, and they carry inline emphasis. Nothing outside
             the repo reaches this. -->
        <p
          class:dismissed={i === active && dismissed}
          aria-hidden={i === active && dismissed ? 'true' : undefined}
        >
          {@html s.html}
          <!-- Only the active, not-yet-dismissed step gets a button: rendering
               one for every step would leave invisible-but-tabbable buttons
               sitting inside the faded-out captions. Gated on `enhanced` too,
               so no-JS never puts it in the document at all. -->
          {#if enhanced && i === active && !dismissed}
            <button
              type="button"
              class="dismiss"
              aria-label="Hide this text"
              onclick={dismissCaption}
            >
              <span aria-hidden="true">×</span>
            </button>
          {/if}
        </p>
      </li>
    {/each}
  </ol>
</section>

<style>
  .scrolly {
    position: relative;
    max-width: 52rem;
    margin-inline: auto;
  }

  /*
   * The pinned frame. It has to hold every capital at once — a sticky element
   * taller than the viewport would park its last rows permanently off-screen —
   * so the row height is whatever a screen's worth of room divided by the
   * number of rows comes to, floored so the bars stay visible and capped so
   * they do not go chunky on a tall monitor. --rank-chrome is what the frame
   * spends on everything that is not rows: the sort header, the source note
   * under the list, the sticky top offset, and the NOW / CONVERTED strip when
   * there is one.
   *
   * The 0.9rem is slack: it covers the list's own spine padding and the
   * sub-pixel rounding of 39 fractional row heights.
   */
  .viz {
    position: sticky;
    top: 1rem;
    z-index: 1;
    --rank-chrome: 5.2rem;
    --rank-row: clamp(
      0.78rem,
      calc((100svh - var(--rank-chrome) - 0.9rem) / var(--rank-n)),
      1.45rem
    );
  }
  .viz.withtoggle {
    --rank-chrome: 7.6rem;
  }

  /*
   * The one case the rows cannot all fit: a viewport too short to give each of
   * them even the floor above, which in practice means a phone turned sideways.
   * Here the frame keeps the screen's height and the list scrolls inside it —
   * the pair <Ranking /> wants, since a ceiling on its own would only clip.
   * Above this height the list always fits and neither is published, so the
   * normal case is never a scroll container.
   */
  @media (max-height: 660px) {
    .viz {
      --rank-h: calc(100svh - var(--rank-chrome));
      --rank-scroll: auto;
    }
  }

  /* the ranking's header and rows narrow off this width, not the window's */
  .rankwrap {
    container: rankcols / inline-size;
  }

  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  /*
   * Step geometry, which the observer below depends on.
   *
   * A step is a viewport tall and lays its sentence out at its own bottom edge;
   * `sticky; bottom` then holds that sentence at the foot of the screen. The pin
   * cannot be perfect for the whole step: sticky is clamped by the block it
   * lives in, so the sentence has to climb a sentence's height into place at one
   * end of the step's travel and slide the same distance out at the other. That
   * cost is fixed — a taller step just moves it — so the only choice is where to
   * spend it, and the marker's offset is what chooses.
   *
   * At --cap-gap, the pin line's own offset, the step's watch ends at the exact
   * scroll position where its sentence stops being pinned. So the whole of the
   * travel lands at the *start* of a step, under the fade-in, and the sentence
   * then sits dead still at the foot of the screen for the entire rest of the
   * step. Nothing ever drifts out of place while it is the one being read.
   */
  .step {
    position: relative;
    --cap-gap: 1.1rem;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  /* absolute, so `justify-content: flex-end` does not sweep it down to the
     bottom with the sentence */
  .mark {
    position: absolute;
    top: var(--cap-gap);
    left: 0;
    width: 1px;
    height: 1px;
  }
  .step > p {
    position: sticky;
    bottom: var(--cap-gap);
    z-index: 2;
    max-width: 34rem;
    margin: 0 auto;
    /*
     * Right padding reserves the dismiss button's own footprint (2.75rem) plus
     * a gap, on every line, not just the first — the button's box sits over
     * the top-right corner for its full height, and a step's sentence can run
     * to one, two or three lines depending on length and viewport, so nothing
     * short of a fixed reservation stays clear of it at every width. Applied
     * unconditionally rather than only while the button is mounted, so text
     * never reflows into or out of that corner as the button appears on
     * arrival or disappears on dismiss.
     */
    padding: 0.85rem 3.35rem 0.85rem 1.05rem;
    border: 1.5px solid var(--ink, #020202);
    /*
     * A scrim, not an opaque block. The frame above fills the screen, so the
     * sentence sits over its last rows by construction and has to stay readable
     * there — an opaque band sized to never overlap would have to eat half the
     * screen. --paper is the illustration's tone, inherited from .pp.
     */
    background: rgba(var(--paper, 255, 255, 255), 0.94);
    backdrop-filter: blur(3px);
    font-family: var(--slab, Georgia, serif);
    font-size: clamp(0.94rem, 1.5vw, 1.08rem);
    line-height: 1.45;
    color: var(--ink, #020202);
    text-wrap: pretty;
  }
  /* one sentence at a time, only once JS is there to say which one */
  .scrolly.js .step > p {
    opacity: 0;
    transition: opacity 220ms ease;
  }
  .scrolly.js .step.on > p {
    opacity: 1;
  }
  /* Dismissing reuses the exact fade the caption already does on arrival —
     same property, same transition, already gated below — rather than a
     second animation. The CSS side only takes it out of sight and out of the
     tab order; `aria-hidden` on the element (set in the markup alongside
     `.dismissed`) is what takes it out of the accessibility tree, since
     opacity and pointer-events alone still leave it in there for a screen
     reader to announce. */
  .scrolly.js .step.on > p.dismissed {
    opacity: 0;
    pointer-events: none;
  }

  /* A corner control sized like a fingertip, not a sentence: the visible chip
     stays small enough to sit in the caption's corner, but the button's own
     box reaches toward the ~44px touch target a phone needs, extending
     inward and down where nothing else is competing for the tap. */
  .step > p .dismiss {
    position: absolute;
    top: 0;
    right: 0;
    width: 2.75rem;
    height: 2.75rem;
    display: grid;
    place-items: start end;
    padding: 0.3rem;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .step > p .dismiss span {
    display: grid;
    place-items: center;
    width: 1.3rem;
    height: 1.3rem;
    border: 1.5px solid var(--ink, #020202);
    background: rgba(var(--paper, 255, 255, 255), 0.94);
    font-size: 0.85rem;
    line-height: 1;
  }
  .step > p .dismiss:focus-visible span {
    outline: 2px solid var(--ink, #020202);
    outline-offset: 2px;
  }

  /* The emphasis inside a sentence arrives as authored HTML, so it carries no
     scoping class of its own and :global is the only way to reach it. Anchored
     to this component's own <p>, so it cannot travel anywhere else. Weight
     carries the emphasis on its own; the colour only ever restates a figure's
     own meaning — green for green, purple for car — so nothing here depends on
     hue alone. */
  .step > p :global(b) {
    font-weight: 700;
  }
  .step > p :global(.g) {
    color: var(--park, #0a6b40);
    font-variant-numeric: tabular-nums;
  }
  .step > p :global(.c) {
    color: var(--asphalt, #7d4a9e);
    font-variant-numeric: tabular-nums;
  }

  @media (prefers-reduced-motion: reduce) {
    .scrolly.js .step > p {
      transition: none;
    }
  }

  /*
   * Phones. Both halves have to stay usable here: the sort buttons reachable and
   * the bars visible at the same time. So the frame gets the screen, the rows
   * shrink to fit it (the clamp above), and the sentence is a two-to-three-line
   * scrimmed strip allowed to sit over the last few rows rather than fighting
   * the chart for the middle of the screen. svh, not vh, so a retracting browser
   * toolbar does not shift the pin under the reader.
   */
  @media (max-width: 700px) {
    .scrolly {
      max-width: none;
    }
    /* a bigger allowance than the desktop one despite the smaller type: at this
       width the sort header wraps to two lines, which costs more than the type
       saves */
    .viz {
      top: 0.5rem;
      --rank-chrome: 6rem;
    }
    .viz.withtoggle {
      --rank-chrome: 8.5rem;
    }
    .step {
      --cap-gap: 0.6rem;
    }
    .step > p {
      /* same reservation as the desktop rule above, just against the tighter
         left/vertical padding this width uses */
      padding: 0.7rem 3.2rem 0.7rem 0.85rem;
      font-size: 0.92rem;
      line-height: 1.4;
    }
  }
</style>
