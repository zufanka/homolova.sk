<script lang="ts">
  import type { PostSummary } from '$lib/posts';
  import PostCard from '$lib/components/PostCard.svelte';

  let { data }: { data: { posts: PostSummary[] } } = $props();
  const featured = data.posts[0];
  const rest = data.posts.slice(1);
</script>

<svelte:head>
  <title>Hey it's Ada</title>
</svelte:head>

{#if featured}
  <section class="featured fadein">
    <PostCard post={featured} variant="featured" />
  </section>
{/if}

<section class="feed">
  {#each rest as post, i (post.slug)}
    <PostCard {post} variant="compact" />
    {#if i === 1}
      <aside class="inbox-banner">
        <span class="inbox-banner__copy">Ada in your inbox</span>
        <a href="/newsletter" class="inbox-banner__cta">subscribe →</a>
      </aside>
    {/if}
  {/each}
</section>

<style>
  .fadein {
    opacity: 0;
    transform: translateY(8px);
    animation: fadein 700ms 80ms ease-out forwards;
  }
  @keyframes fadein { to { opacity: 1; transform: none; } }

  .featured {
    max-width: var(--measure);
    margin: 32px auto 64px;
    padding: 0 var(--gutter);
  }

  .inbox-banner {
    margin-top: 8px;
    padding: 14px 20px;
    border: var(--border);
    background: var(--pink);
    box-shadow: 4px 4px 0 var(--ink);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .inbox-banner__copy {
    font-family: var(--display);
    text-transform: uppercase;
    font-size: clamp(15px, 2.2vw, 18px);
    letter-spacing: -0.01em;
    color: var(--ink);
  }
  .inbox-banner__cta {
    border-bottom: 3px solid var(--ink);
    padding: 0 2px 1px;
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap;
    transition: background 160ms ease-out;
  }
  .inbox-banner__cta:hover { background: var(--ink); color: var(--pink); }

  .feed {
    max-width: var(--measure);
    margin: 24px auto 96px;
    padding: 0 var(--gutter);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  @media (max-width: 720px) {
    .feed { gap: 22px; }
  }
</style>
