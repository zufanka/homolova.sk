<script lang="ts">
  /**
   * A ranking the scroll walks through: the chart pins near the top of the
   * viewport, and each step's sentence pins across the middle of it for as long
   * as that step's block is passing.
   *
   * Progressive enhancement over a document, not a replacement for one. Every
   * step's sentence is a real block in document order and the chart renders
   * whole, so with no JS the section reads as prose over a complete chart.
   * `enhanced` — set in `onMount`, so it is false during the static prerender —
   * is what switches on the one-sentence-at-a-time fade, the progress rail and
   * the scroll cue. Inactive sentences go to `opacity: 0` and are never
   * `aria-hidden` or `display: none`, so a screen reader still walks all of
   * them in order.
   *
   * The step is the unit of control:
   *
   *   - Entering a step writes its sort onto the view. That is the *only* place
   *     the scroll writes, so a click on the sort header or the state toggle
   *     stands until the next boundary — no override bookkeeping needed, the
   *     guard in `claim()` is the whole mechanism.
   *   - The steps are ordinary blocks in flow, so scrolling back up re-enters
   *     the earlier one and re-claims its sort. The sequence is reversible.
   *   - Nothing here calls `focus()` or `scrollTo()`, hijacks a wheel event or
   *     snaps. `IntersectionObserver` and `scrollY` read; the page scrolls
   *     itself.
   *
   * Layout contract, the same shape as Board's `--map-h`: this component owns
   * the dimensions and publishes them, the children read them. `--rank-row` is
   * the row height and `rankcols` is the container the sort header and the rows
   * narrow off. Nothing here ever publishes a height plus a scroll to
   * `<Ranking />`: see the comment over `.viz` for why the frame must never
   * become a scroll container.
   */
  import { onMount, untrack } from 'svelte';
  import { prefersReducedMotion } from 'svelte/motion';
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
  let sectionEl: HTMLElement | undefined;
  /** Whether the *active* step's caption is hidden. One flag, not one per step,
   *  because only the active caption is ever visible to dismiss in the first
   *  place — reset alongside `active` in `claim()` is what makes it clear
   *  again on every boundary crossing, forward or back. */
  let dismissed = $state(false);
  /** The active caption's opacity, driven by how far the reader is through the
   *  step rather than by a timed transition — see `fade()`. Opens at 0: the
   *  section is normally still below the fold on load, and the caption fades up
   *  as the reader arrives. */
  let capOpacity = $state(0);
  /** The first-entry hint. Latches off for good the moment the sequence starts
   *  producing captions, so it never reappears on the way back up. */
  let cueOn = $state(false);

  /**
   * Where the caption fades, in fractions of one step's scroll distance.
   *
   * The sentence must never drift or fade while it is being read, so both ends
   * are pinned to what the sticky caption is physically doing (see the comment
   * over `.step`):
   *
   *   - It travels exactly one caption-height into place at the very start of a
   *     step, so the fade-in is given that same distance — `inEnd` below, one
   *     measured caption height over one step. It reaches full strength at the
   *     instant it stops moving, and never before: a fixed fraction cannot do
   *     this, because a caption is ~8% of a tall phone's viewport and ~30% of a
   *     short landscape one, where 0.15 would have left it legible and still
   *     sliding for half its travel.
   *   - It then sits dead still until the step ends. The fade-out is spent late
   *     and quickly inside that still stretch: the reader gets ~72% of the step
   *     with the sentence stationary and fully legible, then it clears over the
   *     next 16% and the following one arrives at the boundary. That gap is the
   *     evidence that scrolling is doing something.
   */
  const FADE_OUT_START = 0.72;
  const FADE_OUT_END = 0.88;

  function fade(t: number, inEnd: number): number {
    if (t <= 0) return 0;
    if (t < inEnd) return t / inEnd;
    if (t < FADE_OUT_START) return 1;
    if (t < FADE_OUT_END) return (FADE_OUT_END - t) / (FADE_OUT_END - FADE_OUT_START);
    return 0;
  }

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

  /** Assigned in `onMount`. A boundary can be crossed by the observer without a
   *  scroll event of its own arriving after it, and the new step's caption has
   *  to be given its opacity by something. */
  let ping: () => void = () => {};

  function claim(i: number): void {
    if (i === active) return;
    active = i;
    dismissed = false;
    view.sortKey = steps[i].sortKey;
    view.sortDir = steps[i].sortDir ?? SORT_DEFAULT_DIR[steps[i].sortKey];
    ping();
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
     * Geometry, cached. Everything the scroll handler needs is measured here
     * and here only, so a scroll frame reads `window.scrollY` and nothing else
     * — no `getBoundingClientRect`, no forced layout, one rounded style write
     * on the frames where the opacity actually changed.
     *
     * `pins[i]` is step i's pin line in document coordinates, read off the same
     * zero-size marker the observer below watches. Keeping both on the marker
     * is what keeps the fade and the step handover in the same units as the CSS
     * pin: move `--cap-pin` and all three move together.
     */
    let pins: number[] = [];
    /** Each caption's height, which is also the distance it travels into place
     *  at the start of its step — and so the distance the fade-in gets. */
    let caps: number[] = [];
    /** One step's scroll distance: the gap between two pin lines, measured
     *  rather than assumed, so changing `.step`'s height in the stylesheet
     *  carries the fade timing with it and the two cannot drift apart. */
    let span = 0;
    let vh = 0;
    /** The section's top, in document coordinates — only the cue needs it. */
    let top = 0;
    let cueDone = false;
    let lastO = -1;

    function measure(): void {
      const y = window.scrollY;
      vh = window.innerHeight;
      pins = markEls.map((el) => (el ? el.getBoundingClientRect().top + y : 0));
      caps = stepEls.map((el) => el?.querySelector('p')?.getBoundingClientRect().height ?? 0);
      span = pins.length > 1 ? pins[1] - pins[0] : vh;
      top = sectionEl ? sectionEl.getBoundingClientRect().top + y : 0;
    }

    function update(): void {
      const y = window.scrollY;
      // `pins[active] - vh` is the scroll position at which the observer handed
      // this step over: the position where its marker reached the foot of the
      // screen. So `t` is progress through the step the observer says is on,
      // and the two cannot disagree about which caption is fading.
      const t = span > 0 ? Math.min(1, Math.max(0, (y - (pins[active] - vh)) / span)) : 0;
      // Capped: a caption tall enough to eat half its own step would otherwise
      // leave no still stretch at all before FADE_OUT_START.
      const inEnd = span > 0 ? Math.min(0.45, (caps[active] * 1.02) / span) : 0.15;
      // Reduced motion gets the boundaries and nothing in between: present for
      // the whole of its step, gone outside it.
      const raw = prefersReducedMotion.current ? (t > 0 ? 1 : 0) : fade(t, inEnd);
      const o = Math.round(raw * 100) / 100;
      if (o !== lastO) {
        lastO = o;
        capOpacity = o;
      }

      // The cue answers "is this page stuck?", which is only ever asked in the
      // stretch where the chart has pinned and no caption has arrived yet. So
      // it shows once the section is properly on screen and is spent the moment
      // the first step takes over — by then the sequence is visibly running.
      if (!cueDone) {
        if (y >= pins[0] - vh) {
          cueDone = true;
          cueOn = false;
        } else {
          cueOn = y > top - vh * 0.55;
        }
      }
    }

    let frame = 0;
    function schedule(): void {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    }
    ping = schedule;

    function remeasure(): void {
      measure();
      update();
    }

    measure();
    update();

    window.addEventListener('scroll', schedule, { passive: true });
    // innerHeight moves without the section's own height moving — a phone
    // toolbar retracting does exactly that — and every pin line is quoted
    // against it.
    window.addEventListener('resize', remeasure);
    // The steps are sized in svh, so a rotation, a late web font or the toggle
    // strip appearing all move the pin lines. Watching the section is cheaper
    // than guessing which events do that.
    const ro = new ResizeObserver(remeasure);
    if (sectionEl) ro.observe(sectionEl);

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

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', remeasure);
      if (frame) cancelAnimationFrame(frame);
      ping = () => {};
    };
  });
</script>

<section class="scrolly" class:js={enhanced} aria-label={label} bind:this={sectionEl}>
  <div class="viz" class:withtoggle={stateToggle} style:--rank-n={rows.length}>
    {#if stateToggle}<StateToggle />{/if}
    <div class="rankwrap">
      <SortButtons />
      <Ranking {rows} compact highlight={steps[active].highlight ?? null} />
    </div>
  </div>

  <ol class="steps">
    {#each steps as s, i (i)}
      <li
        class="step"
        class:on={i === active}
        class:jsonly={s.enhancedOnly}
        tabindex="-1"
        bind:this={stepEls[i]}
      >
        <span class="mark" data-step={i} bind:this={markEls[i]}></span>
        <!-- The sentences are the article's own prose, written a few lines from
             here in index.svx, and they carry inline emphasis. Nothing outside
             the repo reaches this. -->
        <!-- A sentence about the controls is dropped when there are no working
             controls to talk about — see `enhancedOnly` in types.ts. The <li>
             around it is not: everything the observer and the fade measure is
             indexed off it, so it has to exist in both documents. It is the
             stylesheet's job to stop the empty one leaving a viewport-tall gap
             in the no-JS reading. -->
        {#if enhanced || !s.enhancedOnly}
          <p
            class:dismissed={i === active && dismissed}
            aria-hidden={i === active && dismissed ? 'true' : undefined}
            style:--cap-o={i === active ? capOpacity : null}
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
        {/if}
      </li>
    {/each}
  </ol>

  <!--
    The rail: how many steps there are, which one is on, and on first arrival a
    hint that scrolling is what advances them. Both answer the same complaint —
    a pinned chart over a pinned sentence leaves most of the screen still, which
    reads as a stuck page.

    It is one element for the whole sequence rather than one per step, sticky
    across the section, so it is already there while the chart is pinning and
    before any caption has arrived — which is exactly when the page looks stuck.
    Purely an affordance, so it is gated on `enhanced` and never reaches the
    no-JS document.
  -->
  {#if enhanced}
    <div class="rail">
      <p class="cue" class:on={cueOn} aria-hidden="true">
        Scroll <span class="arrow">↓</span>
      </p>
      <!-- The pips restate where the reader is in a list they can already walk;
           labelled rather than left as a heap of unnamed spans, and not a live
           region — the sort status in <Ranking /> already speaks on every
           boundary and a second announcement there would only talk over it. -->
      <div class="pips" role="img" aria-label="Step {active + 1} of {steps.length}">
        {#each steps as _, i (i)}
          <span class="pip" class:on={i === active}></span>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .scrolly {
    position: relative;
    max-width: 52rem;
    margin-inline: auto;
    /* Two budgets that no longer share a line. The rail keeps the foot of the
       screen — --rail-h of indicator sitting --cap-gap above the bottom edge,
       which is also the allowance .viz makes for it in --rank-chrome. The
       caption is pinned across the middle instead, so --cap-pin is its own
       length: as an offset up from the foot of the screen, half a viewport less
       half a caption puts the sentence's own centre on the screen's.

       CSS cannot know a caption's height — two or three lines depending on the
       width, and twice that for the one long sentence — so --cap-half is the
       nominal half of the ordinary case. Ordinary captions land within a few
       pixels of the centre and the long one rides 1.5–2rem high, which nobody
       notices, and in exchange the pin stays a single length .mark can be handed
       verbatim. That sharing is the load-bearing part: pin and marker being the
       same number is what makes a caption travel exactly its own height into
       place, which is the distance the fade-in is given. Two consumers now,
       .step > p and .mark, and they still must not drift apart. Measuring each
       caption and publishing its own half would centre all of them, at the price
       of a measure-and-write pass between the stylesheet and the scroll handler;
       a couple of rem of slop is cheaper than that coupling.

       svh, not vh or dvh: a retracting phone toolbar may not move the pin line
       under a reader mid-sentence. The price is that while the toolbar is away
       the caption sits half that toolbar below the true centre. */
    --cap-gap: 1.1rem;
    --rail-h: 1.3rem;
    --cap-half: 2.4rem;
    --cap-pin: calc(50svh - var(--cap-half));
  }

  /*
   * The pinned frame. It has to hold every capital at once — a sticky element
   * taller than the viewport parks its last rows off-screen for the length of
   * the sequence — so the row height is whatever a screen's worth of room
   * divided by the number of rows comes to, floored so the bars stay visible
   * and capped so they do not go chunky on a tall monitor. --chrome-own is what
   * the frame spends on everything that is not rows: the sort header, the
   * source note under the list, the sticky top offset, and the NOW / CONVERTED
   * strip when there is one; --rank-chrome adds the rail's strip along the
   * bottom, which the source note has to clear.
   *
   * The 0.9rem is slack: it covers the list's own spine padding and the
   * sub-pixel rounding of 39 fractional row heights.
   *
   * There is deliberately no escape hatch for a viewport too short for even the
   * floored row height — a phone held sideways. The frame used to hand
   * <Ranking /> a max-height and `overflow-y: auto` there, which made the chart
   * its own scroll container: on a touch screen a finger landing on the bars
   * scrolled the list and the page did not advance, so the reader was stuck
   * inside the scrolly with nothing to say why. Nothing in the pinned region
   * may scroll. On those viewports the list simply runs past the foot of the
   * screen and the rows below it come into view at the end of the sequence,
   * where the frame releases — invisible for a while beats untouchable.
   */
  .viz {
    position: sticky;
    top: 1rem;
    z-index: 1;
    --chrome-own: 5.2rem;
    --rank-chrome: calc(var(--chrome-own) + var(--rail-h));
    --rank-row: clamp(
      0.78rem,
      calc((100svh - var(--rank-chrome) - 0.9rem) / var(--rank-n)),
      1.45rem
    );
  }
  .viz.withtoggle {
    --chrome-own: 7.6rem;
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
   * Step geometry, which the observer and the fade both depend on.
   *
   * A step is a viewport tall and lays its sentence out at its own bottom edge;
   * `sticky; bottom: --cap-pin` then holds that sentence across the middle of
   * the screen. The pin cannot be perfect for the whole step: sticky is clamped
   * by the block it lives in, so the sentence has to climb a sentence's height
   * into place at one end of the step's travel and slide the same distance out
   * at the other. That cost is fixed — a taller step just moves it — so the only
   * choice is where to spend it, and the marker's offset is what chooses.
   *
   * The marker carries --cap-pin too, and that identity is the whole trick.
   * Sticky is clamped hardest when a step is entering, which parks its sentence
   * on the step's own top edge — exactly --cap-pin above the foot of the screen
   * at the moment the marker reaches it, and so exactly one caption-height below
   * where the pin will hold it. So the whole of the travel lands at the *start*
   * of a step, and it is one caption tall whatever --cap-pin is set to: move the
   * pin anywhere up or down the screen and this stays true. The sentence then
   * sits dead still, centred, for the entire rest of the step. Nothing ever
   * drifts out of place while it is the one being read: the fade-in covers the
   * travel and the late fade-out is spent inside the still stretch (`inEnd` and
   * FADE_OUT_START in the script).
   */
  /* 65svh, not 100: a step's height is the scroll distance one caption costs,
     and at a full viewport a gentle phone swipe often failed to cross a whole
     one, so the reader had to swipe twice for one sentence. Shortening it is
     the fix with no moving parts — no wheel handling, no programmatic scroll.
     The floor is the caption, not the gesture: the sentence travels its own
     height into place, so a shorter step spends a larger fraction of itself
     moving and a smaller one holding still to be read (FADE_IN_END caps that
     ratio at 0.45, i.e. ~220px). 65svh keeps the still stretch near half the
     step while cutting a third off the swipe. Going much below this starts
     letting a hard flick skip a sentence outright, which is worse than the
     bug it fixes.

     The 24rem floor is what stops that happening on a short landscape phone,
     where 65svh would be ~247px: a 115px caption would then travel 47% of its
     own step, past the 0.45 cap, so it would still be sliding at the moment
     the fade-in declared it readable — the exact fault the per-caption
     FADE_IN_END was introduced to fix. At 24rem the travel stays near 30%
     there, i.e. no worse than before this change. */
  .step {
    position: relative;
    min-height: max(65svh, 24rem);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  /* A step whose sentence was dropped for want of the controls it describes
     (`enhancedOnly` in types.ts) keeps its box so the indices and pin spacing
     hold, but must not spend a screenful of the no-JS reading saying nothing —
     there it collapses to nothing at all. Scoped to :not(.js), so the moment the
     enhancement arrives and the sentence with it, the step is a step again. */
  .scrolly:not(.js) .step.jsonly {
    min-height: 0;
  }
  /* `dismissCaption()` lands focus on the step's own <li> so the reader stays
     where they are when the button they clicked disappears. That <li> is a
     `tabindex="-1"` programmatic target rather than anything the tab order ever
     reaches, and it is a whole step tall — so the ring the browser draws on it
     is a rectangle around most of the screen, which reads as a rendering fault
     rather than as focus. Suppressed here and nowhere else: every control in
     this component that a keyboard can actually reach (the dismiss chip, the
     sort headers) keeps its own visible :focus-visible style. */
  .step:focus-visible {
    outline: none;
  }
  /* absolute, so `justify-content: flex-end` does not sweep it down to the
     bottom with the sentence */
  .mark {
    position: absolute;
    top: var(--cap-pin);
    left: 0;
    width: 1px;
    height: 1px;
  }
  .step > p {
    position: sticky;
    bottom: var(--cap-pin);
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
  /* One sentence at a time, only once JS is there to say which one — and once
     it can say how far through the step the reader is. --cap-o is written by
     the scroll handler on the active caption only, so an inactive one falls
     back to 0 without needing a rule of its own. No transition: the value is
     already a function of scroll position, and easing it as well would let the
     sentence keep changing after the reader stopped. */
  .scrolly.js .step > p {
    opacity: var(--cap-o, 0);
  }
  /* An inactive caption is invisible but still a box, and its step is a whole
     viewport tall, so it can be sitting anywhere over the pinned chart. Left
     hit-testable it swallows taps meant for the row underneath. */
  .scrolly.js .step:not(.on) > p {
    pointer-events: none;
  }
  /* Dismissing is the one opacity change that is not scroll-driven — a click,
     with no scroll distance to spread it over — so it brings its own 220ms
     fade. Higher specificity than the rule above, so it wins over --cap-o for
     as long as the flag is set; clearing the flag at the next boundary hands
     the caption straight back to the scroll handler. The CSS side only takes it
     out of sight and out of the tab order; `aria-hidden` on the element (set in
     the markup alongside `.dismissed`) is what takes it out of the
     accessibility tree, since opacity and pointer-events alone still leave it
     in there for a screen reader to announce. */
  .scrolly.js .step.on > p.dismissed {
    opacity: 0;
    pointer-events: none;
    transition: opacity 220ms ease;
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
  /* A control quoted inside a sentence, drawn the way the control itself is
     drawn: the same 1.3rem square in the same 1.5px ink rule as .dismiss's chip
     above, so a reader told about the × matches it to the one in the corner by
     sight instead of hunting the screen for it. It is a picture of a button, not
     a button — the sentence that uses it gives it a role and a label of its own,
     since a bare × announces as nothing useful. inline-grid keeps the square
     square inside a line of running text; the vertical-align sinks it so its
     middle sits on the type's, not its foot on the baseline. */
  .step > p :global(.chip) {
    display: inline-grid;
    place-items: center;
    width: 1.3rem;
    height: 1.3rem;
    vertical-align: -0.28em;
    border: 1.5px solid var(--ink, #020202);
    background: rgba(var(--paper, 255, 255, 255), 0.94);
    font-size: 0.85rem;
    line-height: 1;
  }

  /*
   * The rail. Sticky across the whole section, clamped by it at both ends, so
   * it rides in with the section's top edge and leaves with its bottom one.
   * pointer-events: none because nothing in it is a control and it lies over
   * the chart's last rows — a tap there belongs to the row underneath.
   */
  .rail {
    position: sticky;
    bottom: var(--cap-gap);
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--rail-h);
    pointer-events: none;
  }
  /* Chrome, not data: this piece spends green and purple on green and car, so
     the indicator is ink and paper only — the same 1.5px rule the captions, the
     dismiss chip and the figures' plates are drawn with. The active pip is a
     filled bar and the rest are hollow squares, so which one is on survives
     without colour: it is wider, and it is solid where they are empty. */
  /* The plate, not a border: the pips lie over the bars and the gaps between
     them would otherwise show purple through. Sized off the pips, so it can
     stand a hair taller than --rail-h without moving anything — the rail's
     height is a fixed length, not its content's. */
  .pips {
    display: flex;
    align-items: center;
    gap: 0.32rem;
    padding: 0.22rem 0.4rem;
    background: rgba(var(--paper, 255, 255, 255), 0.88);
  }
  .pip {
    width: 0.5rem;
    height: 0.5rem;
    border: 1.5px solid var(--ink, #020202);
    background: rgba(var(--paper, 255, 255, 255), 0.94);
    transition: width 200ms ease;
  }
  .pip.on {
    width: 1.25rem;
    background: var(--ink, #020202);
  }

  /* Sits above the pips without being laid out with them: the cue comes and
     goes, and the rail's height is a term in --cap-pin, so it may not change
     when the cue leaves. */
  .cue {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin: 0 0 0.45rem;
    padding: 0.2rem 0.55rem;
    border: 1.5px solid var(--ink, #020202);
    background: rgba(var(--paper, 255, 255, 255), 0.94);
    font-family: var(--sans, system-ui, sans-serif);
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink, #020202);
    white-space: nowrap;
    opacity: 0;
    transition: opacity 200ms ease;
  }
  .cue.on {
    opacity: 1;
  }
  .cue .arrow {
    display: inline-block;
  }
  .cue.on .arrow {
    animation: nudge 1.5s ease-in-out infinite;
  }
  @keyframes nudge {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(0.2rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .scrolly.js .step.on > p.dismissed,
    .cue,
    .pip {
      transition: none;
    }
    .cue.on .arrow {
      animation: none;
    }
  }

  /*
   * Phones. Both halves have to stay usable here: the sort buttons reachable and
   * the bars visible at the same time. So the frame gets the screen, the rows
   * shrink to fit it (the clamp above), and the sentence is a three-line
   * scrimmed strip laid across it.
   *
   * That strip now sits over the middle of the list rather than over its last
   * few rows, and on a phone that is the change that has to be argued for: the
   * chart has the whole screen, the scrim is all but opaque, and so five of the
   * thirty-nine rows are simply gone for as long as a sentence is up (nine under
   * the longest one). The middle is still the cheapest five to lose. These
   * sentences name the ends of a sorted list — the three greenest, the eight
   * worst, the extremes of a range — and both ends stay clear, which the old
   * foot-of-the-screen pin could not say, because it sat on the bottom ranks.
   *
   * --cap-half is left at the desktop value on purpose, even though the sentence
   * runs to three lines here where it runs to two there. The smaller type gives
   * back what the extra line costs — an ordinary caption measures within a few
   * pixels of its desktop self at 390px — so the nominal half holds at both
   * widths and this query does not need one of its own.
   *
   * svh, not vh, so a retracting browser toolbar does not shift the pin under
   * the reader.
   */
  @media (max-width: 700px) {
    .scrolly {
      max-width: none;
      --cap-gap: 0.6rem;
    }
    /* a bigger allowance than the desktop one despite the smaller type: at this
       width the sort header wraps to two lines, which costs more than the type
       saves */
    .viz {
      top: 0.5rem;
      --chrome-own: 6rem;
    }
    .viz.withtoggle {
      --chrome-own: 8.5rem;
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
