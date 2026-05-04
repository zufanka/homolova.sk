<script lang="ts">
  import type { Component } from 'svelte';
  import type { PostFrontmatter } from '$lib/posts';
  import { SITE_URL, absoluteUrl } from '$lib/site';

  let {
    data
  }: {
    data: { meta: PostFrontmatter; component: Component; featuredImageUrl?: string };
  } = $props();
  const Post = data.component;
  const titleFill = data.meta.titleFill ?? 'var(--pink)';
  const fmtDate = (iso: string) => iso.replaceAll('-', ' · ');

  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.meta.title,
    description: data.meta.summary,
    image: data.featuredImageUrl ? absoluteUrl(data.featuredImageUrl) : undefined,
    datePublished: data.meta.date,
    url: `${SITE_URL}/posts/${data.meta.slug}`,
    author: {
      '@type': 'Person',
      name: 'Ada Homolova',
      url: `${SITE_URL}/hello`
    }
  });
</script>

<svelte:head>
  <title>{data.meta.title} — homolova.sk</title>
  {@html `<script type="application/ld+json">${articleJsonLd}</script>`}
</svelte:head>

<article class:fullBleed={data.meta.fullBleed}>
  {#if !data.meta.fullBleed}
    <header class="post-hero">
      {#if data.featuredImageUrl}
        <figure class="post-hero__image">
          <img src={data.featuredImageUrl} alt="" fetchpriority="high" decoding="async" />
        </figure>
      {/if}
      <div class="hero-inner">
        <time datetime={data.meta.date}>{fmtDate(data.meta.date)}</time>
        <h1 style:--title-fill={titleFill}>{data.meta.title}</h1>
        <p class="byline">by <a href="/hello">Ada Homolova</a></p>
        {#if data.meta.summary}
          <p class="summary">{data.meta.summary}</p>
        {/if}
      </div>
    </header>
  {/if}

  {#if data.meta.fullBleed}
    <Post />
  {:else}
    <div class="prose">
      <Post />
    </div>
  {/if}
</article>

<style>
  .post-hero {
    margin-bottom: 3rem;
  }
  .hero-inner {
    max-width: 42rem;
    margin: 0 auto;
    padding: 1.75rem 1.25rem 0;
  }
  .post-hero__image {
    margin: 0 auto 1.75rem;
    max-width: 42rem;
    padding: 0 1.25rem;
    box-sizing: content-box;
  }
  .post-hero__image img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border: var(--border);
  }
  .post-hero time {
    display: block;
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
    letter-spacing: 0.02em;
    margin-bottom: 1.25rem;
    color: var(--muted);
  }
  .post-hero h1 {
    font-family: var(--display);
    text-transform: uppercase;
    font-size: clamp(2.25rem, 7vw, 5rem);
    line-height: 0.95;
    letter-spacing: -0.01em;
    margin: 0;
    color: var(--title-fill, var(--pink));
    -webkit-text-stroke: 2px var(--ink);
    paint-order: stroke fill;
  }
  .post-hero .byline {
    margin: 1rem 0 0;
    font-family: var(--slab);
    font-size: 0.95rem;
    color: var(--muted);
  }
  .post-hero .byline a {
    color: var(--ink);
    border-bottom: 2px solid var(--pink);
    padding-bottom: 1px;
  }
  .post-hero .byline a:hover { background: var(--pink); }
  .post-hero .summary {
    margin: 1.5rem 0 0;
    font-size: 1.1rem;
    max-width: 36rem;
    color: var(--body);
    line-height: 1.5;
  }
  .prose {
    max-width: 42rem;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }
  .prose :global(h2),
  .prose :global(h3) {
    font-family: var(--display);
    text-transform: uppercase;
    letter-spacing: 0.01em;
    line-height: 1.15;
    margin-top: 3rem;
  }
  .prose :global(h2) {
    font-size: 1.4rem;
  }
  .prose :global(h3) {
    font-size: 1.1rem;
  }
  .prose :global(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 1.5rem auto;
  }
  .prose :global(figure) {
    margin: 2.5rem 0;
  }
  .prose :global(figure img) {
    width: 100%;
    margin: 0;
  }
  .prose :global(p:has(> img:only-child)) {
    text-align: center;
  }
  .prose :global(figcaption) {
    margin-top: 0.5rem;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .prose :global(pre) {
    background: var(--code-bg);
    padding: 0.75rem 1rem;
    overflow-x: auto;
    font-size: 0.9rem;
  }
  .prose :global(code) {
    background: var(--code-bg);
    padding: 0.05rem 0.3rem;
    font-size: 0.9em;
  }
  .prose :global(pre code) {
    background: none;
    padding: 0;
  }
  .prose :global(blockquote) {
    border-left: 3px solid var(--rule);
    margin-left: 0;
    padding-left: 1rem;
    color: var(--muted);
  }
  .prose :global(a) {
    border-bottom: 2px solid var(--pink);
    padding-bottom: 1px;
    transition: background 160ms ease-out;
  }
  .prose :global(a:hover) {
    background: var(--pink);
  }
</style>
