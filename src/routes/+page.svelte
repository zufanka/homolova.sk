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
  {#each rest as post (post.slug)}
    <PostCard {post} variant="compact" />
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
    max-width: 720px;
    margin: 32px auto 64px;
  }

  .feed {
    max-width: 720px;
    margin: 24px auto 96px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  @media (max-width: 720px) {
    .feed { gap: 22px; }
  }
</style>
