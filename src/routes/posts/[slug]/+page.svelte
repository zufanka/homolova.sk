<script lang="ts">
  import type { Component } from 'svelte';
  import type { PostFrontmatter } from '$lib/posts';
  import { relatedPosts } from '$lib/posts';
  import SubscribeCta from '$lib/components/SubscribeCta.svelte';
  import PostCard from '$lib/components/PostCard.svelte';
  import { SITE_URL, absoluteUrl } from '$lib/site';
  import Hero from '$lib/components/Hero.svelte';
  import '$lib/styles/post-body.css';

  let {
    data
  }: {
    data: {
      meta: PostFrontmatter;
      component: Component;
      featuredImageUrl?: string;
      heroImageUrl?: string;
    };
  } = $props();
  const Post = data.component;
  const accent = data.meta.titleFill ?? data.meta.footerAccent ?? 'var(--accent, var(--pink))';
  const related = relatedPosts(data.meta, 3);
  const titleFill = data.meta.titleFill ?? 'var(--accent, var(--pink))';
  const overlayHero = $derived(data.meta.heroStyle === 'overlay' && !!data.heroImageUrl);
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
  {#if overlayHero}
    <div class="hero-breakout">
      <Hero
        image={data.heroImageUrl}
        focal={data.meta.heroFocal ?? undefined}
        title={data.meta.title}
        dek={data.meta.summary}
        author="Ada Homolova"
        date={data.meta.date}
      />
    </div>
  {/if}
  {#if !data.meta.fullBleed && !overlayHero}
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
    <div class="post-body">
      <Post />
    </div>
  {/if}
</article>

<section class="post-footer-cta">
  <SubscribeCta {accent} />
</section>

<section class="read-more">
  <h2>Read more</h2>
  <div class="read-more__list">
    {#each related as post (post.slug)}
      <PostCard {post} />
    {/each}
  </div>
</section>

<style>
  .hero-breakout {
    width: 100vw;
    margin-inline: calc(50% - 50vw);
    margin-bottom: 3rem;
  }
  .post-hero {
    margin-bottom: 4rem;
  }
  .hero-inner {
    max-width: var(--measure);
    margin: 0 auto;
    padding: 1.75rem 1.25rem 0;
  }
  .post-hero__image {
    margin: 0 auto 1.75rem;
    max-width: var(--measure);
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
  .post-footer-cta {
    max-width: var(--measure);
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }
  .read-more {
    max-width: var(--measure);
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }
  .read-more h2 {
    font-family: var(--site-display);
    text-transform: uppercase;
    letter-spacing: 0.01em;
    line-height: 1.15;
    font-size: 1.4rem;
    margin: 3rem 0 1.5rem;
  }
  .read-more__list {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .post-body {
    max-width: var(--measure);
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }
</style>
