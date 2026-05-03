<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} — homolova.sk</title>
</svelte:head>

<section class="err">
  <div class="err__ghost" aria-hidden="true">{page.status}</div>
  <h1 class="err__title">
    {page.status === 404 ? 'page not found' : 'something broke'}
  </h1>
  <p class="err__msg">
    {page.status === 404
      ? 'try one of the doors below.'
      : (page.error?.message ?? 'something went wrong on our end.')}
  </p>
  <p class="err__links">
    <a href="/">← homepage</a>
    <span>·</span>
    <a href="/rss.xml">rss</a>
    <span>·</span>
    <a href="/hello">hello</a>
  </p>
</section>

<style>
  .err {
    max-width: 38rem;
    margin: 96px auto 96px;
    padding: 0 1.25rem;
    text-align: center;
    position: relative;
  }
  .err__ghost {
    font-family: var(--display);
    font-size: clamp(160px, 28vw, 320px);
    line-height: 0.85;
    color: var(--pink);
    opacity: 0.18;
    letter-spacing: -0.04em;
    pointer-events: none;
    user-select: none;
    margin-bottom: -40px;
  }
  .err__title {
    font-family: var(--display);
    text-transform: uppercase;
    font-size: clamp(2rem, 6vw, 3.5rem);
    line-height: 0.95;
    margin: 0;
    color: var(--pink);
    -webkit-text-stroke: 2px var(--ink);
    paint-order: stroke fill;
    position: relative;
  }
  .err__msg {
    margin: 1.25rem 0 2rem;
    color: var(--body);
    font-size: 1.05rem;
  }
  .err__links {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.95rem;
  }
  .err__links a {
    border-bottom: 2px solid var(--pink);
    padding-bottom: 1px;
    font-weight: 500;
  }
  .err__links a:hover { background: var(--pink); }
  .err__links span { color: var(--muted); }
</style>
