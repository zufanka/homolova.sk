<script lang="ts">
  /**
   * Shared post hero: display title, dek, byline. Purely token-driven — no
   * colour props; a per-post theme (see src/lib/themes/) restyles it by
   * overriding the CSS custom properties.
   *
   * With `image`, the hero becomes a fullscreen background-image band: the
   * image sits behind the content under a token-driven scrim that fades into
   * the page background. `focal` tunes the crop (CSS object-position).
   *
   * `decoration` snippet: rendered behind/around the content (e.g. scattered
   * illustrations); it owns its own positioning.
   * `byline` snippet: overrides the default author/date line.
   */
  import type { Snippet } from 'svelte';

  let {
    title,
    dek,
    author,
    date,
    image,
    focal,
    decoration,
    byline
  }: {
    title: string;
    dek?: string;
    author?: string;
    date?: string;
    image?: string;
    focal?: string;
    decoration?: Snippet;
    byline?: Snippet;
  } = $props();

  const fmtDate = (iso: string) => iso.replaceAll('-', ' · ');
</script>

<header class="hero" class:hero--image={image}>
  {#if image}
    <img
      class="hero-image"
      src={image}
      alt=""
      aria-hidden="true"
      fetchpriority="high"
      decoding="async"
      style:object-position={focal ?? 'center'}
    />
  {/if}
  {#if decoration}
    <div class="hero-decoration" aria-hidden="true">
      {@render decoration()}
    </div>
  {/if}
  <div class="hero-content">
    <h1>{title}</h1>
    {#if dek}
      <p class="hero-dek">{dek}</p>
    {/if}
    {#if byline}
      {@render byline()}
    {:else if author || date}
      <p class="hero-byline">
        {#if author}by <a href="/hello">{author}</a>{/if}
        {#if author && date} · {/if}
        {#if date}{fmtDate(date)}{/if}
      </p>
    {/if}
  </div>
</header>

<style>
  .hero {
    position: relative;
    text-align: center;
  }
  /* Fullscreen background-image mode */
  .hero--image {
    display: grid;
    align-content: center;
    min-height: calc(100svh - 5rem);
  }
  .hero-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }
  /* Base scrim: gentle full-bleed wash whose only strong job is dissolving
     the image into the page background at the bottom. */
  .hero--image::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        to bottom,
        rgba(var(--hero-wash), 0.18) 0%,
        rgba(var(--hero-wash), 0.3) 55%,
        var(--bg) 100%
      );
    pointer-events: none;
  }
  /* Localized radial wash behind the text block — the main legibility
     layer. Auto-sizes to the content on every viewport. */
  .hero--image .hero-content::before {
    content: '';
    position: absolute;
    inset: -5.5rem -5rem;
    background:
      radial-gradient(
        ellipse closest-side,
        rgba(var(--hero-wash), 0.62),
        rgba(var(--hero-wash), 0.38) 55%,
        transparent 100%
      );
    pointer-events: none;
  }
  .hero-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .hero-image,
  .hero--image::before,
  .hero-decoration {
    z-index: 0;
  }
  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 42rem;
    margin: 0 auto;
    padding: 2.5rem 1.25rem;
  }
  .hero-content > * {
    position: relative;
    z-index: 1;
  }
  h1 {
    font-family: var(--display);
    font-size: clamp(2.25rem, 5vw, 3.75rem);
    line-height: 1.05;
    letter-spacing: -0.01em;
    margin: 0 0 1.25rem;
    color: var(--ink);
  }
  .hero-dek {
    font-size: clamp(1.15rem, 2vw, 1.4rem);
    line-height: 1.5;
    color: var(--body-soft);
    max-width: 36ch;
    margin: 0 auto;
  }
  .hero-byline {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 2rem 0 0;
  }
  .hero-byline a {
    color: inherit;
  }
  /* Image mode: token-driven tone + soft shadow (defense in depth). */
  .hero--image h1 {
    color: var(--hero-text);
    text-shadow: 0 0 1.25rem rgba(var(--hero-wash), 0.55), 0 1px 4px rgba(0, 0, 0, 0.35);
  }
  .hero--image .hero-dek {
    color: var(--hero-text-soft);
    text-shadow: 0 0 1.25rem rgba(var(--hero-wash), 0.55), 0 1px 4px rgba(0, 0, 0, 0.35);
  }
  .hero--image .hero-byline {
    color: var(--hero-text-muted);
  }
  .hero--light {
    --hero-text: var(--ink);
    --hero-text-soft: var(--body-soft);
    --hero-text-muted: var(--muted);
  }
</style>
