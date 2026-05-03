<script lang="ts">
  import { postUrl, type PostSummary } from '$lib/posts';

  type Variant = 'featured' | 'compact';

  let {
    post,
    variant = 'compact'
  }: { post: PostSummary; variant?: Variant } = $props();
</script>

<a
  href={postUrl(post)}
  class="card card--{variant}"
  data-sveltekit-reload={post.externalUrl ? '' : undefined}
>
  {#if post.featuredImageUrl}
    <span class="card__image">
      <img
        src={post.featuredImageUrl}
        alt=""
        fetchpriority={variant === 'featured' ? 'high' : undefined}
        loading={variant === 'compact' ? 'lazy' : undefined}
        decoding="async"
      />
    </span>
  {/if}
  <div class="card__body">
    <div class="card__meta">
      <span class="card__date">{post.date.replaceAll('-', ' · ')}</span>
      {#if post.tags?.length}
        <span class="card__tags">
          {#each post.tags as tag (tag)}
            <span class="card__tag card__tag--{tag}">{tag}</span>
          {/each}
        </span>
      {/if}
    </div>
    {#if variant === 'featured'}
      <h1 class="card__title">{post.title}</h1>
    {:else}
      <h2 class="card__title card__title--sm">{post.title}</h2>
    {/if}
    <p class="card__desc">{post.summary}</p>
  </div>
</a>

<style>
  .card {
    position: relative;
    display: block;
    border: var(--border);
    background: var(--card);
    transition: transform 180ms ease-out;
    color: inherit;
  }
  .card:hover { transform: translate(-2px, -2px); }

  .card__image {
    display: block;
    overflow: hidden;
    background: var(--pink);
  }
  .card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .card__meta {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
  }
  .card__date {
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 14px;
    color: var(--muted);
    letter-spacing: 0.02em;
  }
  .card__tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .card__tag {
    font-family: var(--slab);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 11px;
    border: 1.5px solid var(--ink);
    padding: 4px 8px;
  }
  .card__tag--essay   { background: var(--mint); }
  .card__tag--data    { background: var(--blue); color: var(--ink); }
  .card__tag--fiction { background: var(--orange); }

  .card__title {
    position: relative;
    font-family: var(--display);
    font-size: 64px;
    line-height: 0.95;
    letter-spacing: 0.005em;
    text-transform: uppercase;
    margin: 0 0 22px;
    color: var(--pink);
    -webkit-text-stroke: 2px var(--ink);
    text-shadow:
      -1px -1px 0 var(--ink),
       1px -1px 0 var(--ink),
      -1px  1px 0 var(--ink),
       1px  1px 0 var(--ink);
    paint-order: stroke fill;
  }
  .card__title--sm {
    font-size: 40px;
    margin: 0 0 16px;
    -webkit-text-stroke: 1.5px var(--ink);
  }
  .card__desc {
    font-size: 16px;
    color: var(--body);
    margin: 0;
    line-height: 1.45;
    max-width: 56ch;
  }

  .card--featured .card__image {
    aspect-ratio: 16 / 9;
    border-bottom: var(--border);
  }
  .card--featured .card__body {
    padding: 40px;
  }
  .card--featured .card__desc {
    font-size: 18px;
  }

  .card--compact {
    display: flex;
    flex-direction: row-reverse;
    align-items: stretch;
    gap: 0;
    padding: 0;
    min-height: 240px;
  }
  .card--compact .card__image {
    flex: 0 0 240px;
    border: 0;
    border-left: var(--border);
    align-self: stretch;
  }
  .card--compact .card__body {
    flex: 1;
    min-width: 0;
    padding: 28px 32px;
  }

  @media (max-width: 720px) {
    .card__title { font-size: 40px; }
    .card__title--sm { font-size: 30px; margin-bottom: 12px; }

    .card--featured .card__body { padding: 24px; }
    .card--featured .card__image { aspect-ratio: 4 / 3; }

    .card--compact {
      flex-direction: column;
      padding: 0;
      gap: 0;
    }
    .card--compact .card__image {
      flex: 0 0 auto;
      aspect-ratio: 16 / 9;
      border: 0;
      border-bottom: var(--border);
    }
    .card--compact .card__body {
      padding: 24px;
    }
  }
</style>
