<!--
  Section divider — three little bean PNGs sitting in a row.
  Default trio covers warm / neutral / cool from the palette; pass any
  filenames (without extension) from public/images/beans/ to vary it.
-->
<script>
  let { beans = ['red-lentils', 'chickpeas', 'dupuy'] } = $props();
</script>

<div class="divider" aria-hidden="true">
  {#each beans as bean}
    <img src={`/images/beans/${bean}.png`} alt="" />
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
