<!--
  Minimal scrollytelling primitive.
  Renders the <slot /> once per step; each step reports its index to `value`
  when it intersects the viewport's center band.

  Usage:
    <Scrolly bind:value={stepIndex}>
      {#each steps as step, i}
        <div class="step" class:active={i === stepIndex}>{step.text}</div>
      {/each}
    </Scrolly>
-->
<script>
  import { onMount } from 'svelte';

  let { value = $bindable(0), root = null, rootMargin = '-45% 0px -45% 0px', children } = $props();

  let container = $state();

  onMount(() => {
    const steps = Array.from(container.querySelectorAll('[data-step]'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.step);
            if (!Number.isNaN(idx)) value = idx;
          }
        }
      },
      { root, rootMargin, threshold: 0 }
    );
    steps.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
</script>

<div bind:this={container} class="scrolly">
  {@render children?.()}
</div>

<style>
  .scrolly {
    position: relative;
  }
</style>
