<!--
  Section divider — three little bean PNGs sitting in a row.
  Default trio covers warm / neutral / cool from the palette; pass any
  filenames (without extension) from public/images/beans/ to vary it.
-->
<script>
  // Eagerly resolve every PNG in ../img/beans/ to a Vite-built URL at compile
  // time. Keyed by filename (without extension) for lookup from props.
  const beanImages = Object.fromEntries(
    Object.entries(
      import.meta.glob('../img/beans/*.png', { eager: true, query: '?url', import: 'default' }),
    ).map(([path, url]) => [path.match(/([^/]+)\.png$/)[1], url]),
  );

  let { beans = ['red-lentils', 'chickpeas', 'dupuy'] } = $props();
</script>

<div class="divider" aria-hidden="true">
  {#each beans as bean}
    <img src={beanImages[bean]} alt="" />
  {/each}
</div>

<style>
  .divider {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.25rem;
    max-width: 640px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }
  .divider img {
    width: clamp(40px, 6vw, 64px);
    height: auto;
    display: block;
  }
</style>
