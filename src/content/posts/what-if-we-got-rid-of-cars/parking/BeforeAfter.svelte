<script lang="ts">
  /**
   * A photographed car park and the same view reimagined as green, cut against
   * each other. Two presentations of one pair, one component:
   *
   *   <BeforeAfter pair="…" />                    a draggable wipe
   *   <BeforeAfter pair="…" interactive={false} /> the same pair frozen at 50/50
   *
   * They share one frame, one geometry and one caption so the two can be
   * compared fairly — the only difference is whether the seam moves.
   *
   * The reveal is a single custom property. `--pos` is the share of the frame
   * the photograph occupies, and both the clip on the top image and the left
   * offset of the seam read it, so the cut and the handle cannot drift apart:
   * there is only one number. It is set inline on .frame rather than in the
   * stylesheet because it is the one thing here that changes per instance.
   *
   * The drag is a real <input type="range"> laid over the frame at opacity 0,
   * with the visible handle drawn separately. Deliberate, not a shortcut:
   * the native control already knows that a horizontal drag on a touchscreen
   * must not eat a vertical page scroll, that arrow keys and Home/End should
   * move it, and how to announce itself to a screen reader. Hand-rolled
   * pointerdown/pointermove gets none of that and is where these widgets
   * usually break on a phone. Don't replace it.
   *
   * The caption arrives as a snippet from the article rather than as a string
   * prop, for the same reason `<ScrollyRanking />` takes its sentences from
   * index.svx: a caption is the article's prose, and this one carries links
   * (photographer credits) that a string could only deliver as raw HTML. The
   * component owns the plumbing — files, sizes, alt text — and nothing else.
   */
  import type { Snippet } from 'svelte';

  // Every encode, imported statically so Vite can fingerprint them. Within a
  // pair both images are encoded at byte-identical dimensions at both widths —
  // a wipe between two differently-shaped images tears at the seam — but the
  // three pairs are shaped differently from each other, so the frame's ratio
  // and the srcset's large descriptor travel with the pair.
  import belvedereBeforeSmall from '../media/belvedere-before-800.webp?url';
  import belvedereBeforeLarge from '../media/belvedere-before-1280.webp?url';
  import belvedereAfterSmall from '../media/belvedere-after-800.webp?url';
  import belvedereAfterLarge from '../media/belvedere-after-1280.webp?url';
  import grandmaBeforeSmall from '../media/grandma-before-800.webp?url';
  import grandmaBeforeLarge from '../media/grandma-before-1280.webp?url';
  import grandmaAfterSmall from '../media/grandma-after-800.webp?url';
  import grandmaAfterLarge from '../media/grandma-after-1280.webp?url';
  import grossgerauBeforeSmall from '../media/grossgerau-before-800.webp?url';
  import grossgerauBeforeLarge from '../media/grossgerau-before-1080.webp?url';
  import grossgerauAfterSmall from '../media/grossgerau-after-800.webp?url';
  import grossgerauAfterLarge from '../media/grossgerau-after-1080.webp?url';

  type Pair = {
    beforeSmall: string;
    beforeLarge: string;
    afterSmall: string;
    afterLarge: string;
    /** the large encode's dimensions: the frame's aspect ratio, the <img>
     *  width/height attributes and the srcset's large descriptor all come off
     *  these, so there is one place to change when a file is re-encoded */
    w: number;
    h: number;
    beforeAlt: string;
    afterAlt: string;
  };

  /** every pair's small encode is 800w; only the large one varies */
  const SMALL_W = 800;

  const PAIRS = {
    belvedere: {
      beforeSmall: belvedereBeforeSmall,
      beforeLarge: belvedereBeforeLarge,
      afterSmall: belvedereAfterSmall,
      afterLarge: belvedereAfterLarge,
      w: 1280,
      h: 905,
      beforeAlt:
        'The Belvedere courtyard in Vatican City at sunset, seen from above one ' +
        'end: a long rectangular court walled in by four-storey Renaissance palace ' +
        'wings, its entire floor asphalt, parked nose to tail with cars, vans and ' +
        'coaches around a small central fountain.',
      afterAlt:
        'The same courtyard, the same buildings and the same sunset, reimagined ' +
        'with the asphalt replaced by a garden: mature trees down both sides, ' +
        'lawns, gravel paths and lamps around the fountain, with people walking, ' +
        'sitting on the grass and eating at tables in the arcades.'
    },
    grandma: {
      beforeSmall: grandmaBeforeSmall,
      beforeLarge: grandmaBeforeLarge,
      afterSmall: grandmaAfterSmall,
      afterLarge: grandmaAfterLarge,
      w: 1280,
      h: 720,
      beforeAlt:
        'The view from a fifth-floor balcony in Petržalka, a white balcony rail ' +
        'across the bottom left corner: a wide concrete parking lot filling the ' +
        'foreground with two ranks of parked cars, a line of mature trees behind ' +
        'it, and a wall of long panel blocks along the horizon.',
      afterAlt:
        'The same view from the same balcony, reimagined with the concrete lot ' +
        'replaced by a park: stone paths winding between young trees and ' +
        'flowering undergrowth, a small pond edged with reeds, benches, and two ' +
        'people walking — the same panel blocks still on the horizon.'
    },
    grossgerau: {
      beforeSmall: grossgerauBeforeSmall,
      beforeLarge: grossgerauBeforeLarge,
      afterSmall: grossgerauAfterSmall,
      afterLarge: grossgerauAfterLarge,
      w: 1080,
      h: 516,
      beforeAlt:
        'An aerial view of a car park on the edge of Gross-Gerau: several ' +
        'hectares of asphalt ruled into rows and packed end to end with new ' +
        'cars, a long white multi-storey deck along one side, ploughed fields ' +
        'to the left and a multi-track railway line running across the bottom.',
      afterAlt:
        'The same ground from the same height, reimagined as a public park: ' +
        'lawns and curving gravel paths, beds of yellow and red flowers, a pond, ' +
        'picnic tables, benches and a playground with a slide and swings — the ' +
        'same fields and the same railway line still framing it.'
    }
  } satisfies Record<string, Pair>;

  let {
    pair,
    caption,
    interactive = true
  }: { pair: keyof typeof PAIRS; caption: Snippet; interactive?: boolean } = $props();

  const img = $derived(PAIRS[pair]);

  let pos = $state(50);

  /** The frozen version ignores the slider entirely, so one template serves
   *  both and the static split cannot be nudged off centre by stale state. */
  const shown = $derived(interactive ? pos : 50);

  // 42rem (672px) is the article's reading measure and the widest this figure
  // is ever drawn, so a 1x desktop takes the 800 and only a 2x screen reaches
  // for the large one. Phones never pull the large pair.
  const SIZES = '(min-width: 46rem) 672px, 100vw';
</script>

<figure class="ba">
  <!-- aspect-ratio and the width/height on each <img> come off the same encode,
       so the frame holds its shape before either image has loaded and the page
       doesn't jump. -->
  <div class="frame" style:--pos="{shown}%" style:--ratio="{img.w} / {img.h}">
    <!-- The green version is the base layer and fills the frame; the photograph
         is clipped over it from the left. Ordering it this way means that if the
         clip is not supported the reader still sees one complete, coherent
         image rather than two half ones. -->
    <img
      class="layer"
      src={img.afterLarge}
      srcset="{img.afterSmall} {SMALL_W}w, {img.afterLarge} {img.w}w"
      sizes={SIZES}
      width={img.w}
      height={img.h}
      alt={img.afterAlt}
      loading="lazy"
      decoding="async"
    />
    <img
      class="layer clipped"
      src={img.beforeLarge}
      srcset="{img.beforeSmall} {SMALL_W}w, {img.beforeLarge} {img.w}w"
      sizes={SIZES}
      width={img.w}
      height={img.h}
      alt={img.beforeAlt}
      loading="lazy"
      decoding="async"
    />

    <!-- Which half is which, in words. The two states differ by colour
         (asphalt grey against green) far too obviously to rely on it, and a
         reader who cannot tell them apart by hue gets the same labels. -->
    <span class="tag left">Photograph</span>
    <span class="tag right">Reimagined</span>

    {#if interactive}
      <!-- The wording matches the two tags above rather than describing the
           scene, so a reader who hears the value can line it up with the labels
           sighted readers are reading; what is actually in each half is the
           two images' alt text. -->
      <input
        class="wipe"
        type="range"
        min="0"
        max="100"
        step="1"
        bind:value={pos}
        aria-label="Wipe between the photograph and the reimagined version"
        aria-valuetext="{pos}% photograph, {100 - pos}% reimagined"
      />
    {/if}

    <!-- The seam. Present in both versions and identical in both — in the
         static one it is the whole point, in the wipe it marks where the cut
         is. aria-hidden because the range above already carries the meaning;
         the handle is only its picture. -->
    <div class="seam" class:draggable={interactive} aria-hidden="true">
      {#if interactive}
        <span class="grip">
          <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true">
            <path
              d="M8 1 L2 6 L8 11 M14 1 L20 6 L14 11"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="square"
            />
          </svg>
        </span>
      {/if}
    </div>
  </div>

  <figcaption>{@render caption()}</figcaption>
</figure>

<style>
  .ba {
    margin: clamp(1rem, 4vw, 3rem) auto clamp(2rem, 6vw, 4rem);
    max-width: var(--measure);
  }

  .frame {
    position: relative;
    aspect-ratio: var(--ratio);
    /* The piece's recurring 1.5px ink border, here doing a second job: it
       gives the figure a hard edge for the seam to run between, so the wipe
       reads as one object being cut rather than two images abutting. */
    border: 1.5px solid var(--ink);
    background: var(--plate, #fdf5f0);
    /* keeps the range input's overhang (see .wipe) from taking clicks outside
       the picture, and the seam from drawing over the border */
    overflow: hidden;
  }

  .layer {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  /* inset(top right bottom left): trimming `100% - --pos` off the right leaves
     the leftmost --pos of the photograph standing over the green. */
  .clipped {
    clip-path: inset(0 calc(100% - var(--pos)) 0 0);
  }

  .tag {
    position: absolute;
    top: 0;
    z-index: 3;
    padding: 0.2rem 0.45rem;
    background: var(--ink);
    color: var(--bg, #fff);
    font-family: var(--sans, system-ui, sans-serif);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    /* white on ink, so a label holds up over whichever half ends up under it
       once the seam has passed beneath it */
    pointer-events: none;
  }
  .tag.left {
    left: 0;
  }
  .tag.right {
    right: 0;
  }

  .seam {
    position: absolute;
    top: 0;
    bottom: 0;
    left: var(--pos);
    width: 0;
    border-left: 1.5px solid var(--ink);
    /* the border hangs to the right of `left`, so pull back half of it to sit
       the line's centre exactly on --pos */
    margin-left: -0.75px;
    z-index: 2;
    pointer-events: none;
  }

  /* The knob. A filled park-green pill on the ink line: big enough to read as
     a thing you take hold of, and the only saturated element in the frame, so
     the eye lands on it before it lands on the picture. */
  .grip {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 1.75rem;
    background: var(--park, #0a6b40);
    border: 1.5px solid var(--ink);
    color: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }
  .grip :global(svg) {
    display: block;
  }

  /* The control itself: full-bleed over the frame and invisible, because the
     seam above is its handle. Widened by one thumb and pulled left by half of
     one so the thumb's *centre* travels the frame's full width — otherwise the
     grab point and the drawn line disagree by up to half a thumb at each end,
     which is exactly where a reader drags hardest. */
  .wipe {
    --thumb: 2.75rem;
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(var(--thumb) / -2);
    width: calc(100% + var(--thumb));
    height: 100%;
    margin: 0;
    padding: 0;
    z-index: 4;
    opacity: 0;
    appearance: none;
    -webkit-appearance: none;
    background: none;
    cursor: ew-resize;
  }
  .wipe::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: var(--thumb);
    height: 100%;
  }
  .wipe::-moz-range-thumb {
    width: var(--thumb);
    height: 100%;
    border: 0;
    border-radius: 0;
  }

  /* Keyboard focus lands on the invisible input, so the focus ring has to be
     drawn on the thing the reader can actually see. :focus-visible only, so a
     pointer drag doesn't leave a ring behind. */
  .wipe:focus-visible ~ .seam .grip {
    outline: 3px solid var(--orange, #e8590c);
    outline-offset: 2px;
  }
  .wipe:focus-visible ~ .seam {
    border-left-width: 3px;
  }

  @media (prefers-reduced-motion: no-preference) {
    .grip {
      transition: background-color 120ms ease;
    }
  }
  /* Behind `hover: hover` because a touchscreen latches :hover after a tap:
     without this the handle stays inked for the rest of the visit once the
     reader has dragged it, which reads as a disabled control. */
  @media (hover: hover) {
    .frame:hover .grip {
      background: var(--ink);
    }
  }

  /* The post's `.pp :global(figcaption)` rule already styles this and wins on
     specificity; these are the same values, kept so the component is not
     naked if it is ever lifted out of this article. The links a caption snippet
     brings with it are styled by the post's `.pp :global(figcaption a)` rule,
     which reaches in here on purpose — a credit link should wear the same
     orange underline as every other link in the essay. */
  figcaption {
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--muted);
    margin-top: 0.9rem;
  }

  @media (max-width: 480px) {
    .tag {
      font-size: 0.55rem;
      padding: 0.15rem 0.35rem;
    }
    .grip {
      width: 2.25rem;
      height: 1.6rem;
    }
  }
</style>
