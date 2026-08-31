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

{#if featured}  <section class="featured fadein">
    <PostCard post={featured} variant="featured" />
  </section>
{/if}

<section class="feed">
  {#each rest as post, i (post.slug)}
    <PostCard {post} variant="compact" />
    {#if i === 1}
      <aside class="inbox-banner">
        <img class="inbox-banner__photo" src="/images/ada-portrait.webp" alt="Portrait of Ada Homolova" />
        <div class="inbox-banner__body">
          <p class="inbox-banner__text">
            Welcome! 👋 I'm a freelance
            <a class="hero__link hero__link--pink" href="/hello">data journalist</a>
            and a
            <a class="hero__link hero__link--green" href="https://datafrosch.fun" target="_blank" rel="noopener">professional frosch</a>.
            Here I publish essays on what intrigues me about the weird and wondrous systems we live in.
          </p>
          <a href="/newsletter" class="btn">subscribe →</a>
        </div>
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

  .inbox-banner {
    border: var(--border);
    background: var(--pink);
    display: flex;
    align-items: stretch;
    min-height: 240px;
  }
  .inbox-banner__photo {
    flex: 0 0 33%;
    width: 33%;
    object-fit: cover;
    object-position: right bottom;
    display: block;
  }
  .inbox-banner__body {
    flex: 1;
    padding: 28px 32px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;
    min-width: 0;
  }
  .inbox-banner__text {
    margin: 0;
    font-family: var(--slab);
    font-size: clamp(17px, 2vw, 19px);
    line-height: 1.5;
    color: var(--ink);
  }
  .inbox-banner__text a {
    color: var(--ink);
    font-weight: 700;
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
    transition: background 160ms ease-out;
  }
  .inbox-banner__text a:hover {
    background: var(--pink);
  }

  .featured {
    max-width: var(--measure);
    margin: 32px auto 64px;
    padding: 0 var(--gutter);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 22px;
    border: var(--border);
    background: var(--bg);
    color: var(--ink);
    font-family: var(--display);
    font-size: 18px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    text-decoration: none;
    align-self: flex-start;
    margin-top: 12px;
    box-shadow: 4px 4px 0 var(--ink);
    transition: transform 140ms ease-out, box-shadow 140ms ease-out, background 140ms ease-out;
  }
  .btn:hover {
    background: var(--mint);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--ink);
  }
  .btn:active {
    transform: translate(4px, 4px);
    box-shadow: 0 0 0 var(--ink);
  }

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
    .inbox-banner {
      flex-direction: column;
    }
    .inbox-banner__photo {
      flex: none;
      width: 100%;
      min-height: 200px;
      border-bottom: var(--border);
    }
  }
</style>
