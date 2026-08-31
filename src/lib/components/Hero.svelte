<script lang="ts">
  /**
   * Shared full-bleed post hero: kicker, display title, dek, byline, and a
   * scroll hint. Purely token-driven — no colour props; a per-post theme
   * (see src/lib/themes/) restyles it by overriding the CSS custom properties.
   *
   * `decoration` snippet: rendered behind/around the content (e.g. scattered
   * illustrations); it owns its own positioning.
   * `byline` snippet: overrides the default author/date line.
   */
  import type { Snippet } from 'svelte';

  let {
    kicker,
    title,
    dek,
    author,
    date,
    scrollLabel,
    decoration,
    byline
  }: {
    kicker?: string;
    title: string;
    dek?: string;
    author?: string;
    date?: string;
    scrollLabel?: string;
    decoration?: Snippet;
    byline?: Snippet;
  } = $props();

  const fmtDate = (iso: string) => iso.replaceAll('-', ' · ');
</script>

<header class="hero">
  {#if decoration}
    <div class="hero-decoration" aria-hidden="true">
      {@render decoration()}
    </div>
  {/if}
  <div class="hero-content">
    {#if kicker}
      <p class="hero-kicker">{kicker}</p>
    {/if}
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
    {#if scrollLabel}
      <p class="hero-scroll-hint">
        <span>{scrollLabel}</span>
        <span class="hero-scroll-arrow" aria-hidden="true">↓</span>
      </p>
    {/if}
  </div>
</header>

<style>
  .hero {
    position: relative;
    text-align: center;
  }
  .hero-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 42rem;
    margin: 0 auto;
    padding: 2.5rem 1.25rem;
  }
  .hero-kicker {
    font-family: var(--sans);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 2rem;
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
  .hero-scroll-hint {
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 3rem 0 0;
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }
  .hero-scroll-arrow {
    display: inline-block;
    animation: hero-scroll-bob 1.8s ease-in-out infinite;
  }
  @keyframes hero-scroll-bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(4px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-scroll-arrow {
      animation: none;
    }
  }
</style>
