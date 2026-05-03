<script>
  import { onMount, tick } from 'svelte';

  export let number = 1;
  export let text = '';

  let open = false;
  let wrapperEl;
  let bodyEl;
  let adjustedLeft = null;
  let arrowLeft = null;

  async function toggle() {
    open = !open;
    if (open) {
      adjustedLeft = null;
      arrowLeft = null;
      await tick();
      adjustPosition();
    }
  }

  function adjustPosition() {
    if (!bodyEl || !wrapperEl) return;

    const bodyRect = bodyEl.getBoundingClientRect();
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 8;

    // Check right overflow
    if (bodyRect.right > viewportWidth - padding) {
      const overflow = bodyRect.right - (viewportWidth - padding);
      adjustedLeft = `calc(50% - ${overflow}px)`;
      arrowLeft = `calc(50% + ${overflow}px)`;
    }
    // Check left overflow
    else if (bodyRect.left < padding) {
      const overflow = padding - bodyRect.left;
      adjustedLeft = `calc(50% + ${overflow}px)`;
      arrowLeft = `calc(50% - ${overflow}px)`;
    }
  }

  function handleClickOutside(event) {
    if (open && wrapperEl && !wrapperEl.contains(event.target)) {
      open = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
</script>

<span class="footnote-wrapper" bind:this={wrapperEl}>
  <button class="footnote-marker" on:click={toggle} aria-label="Footnote {number}">{number}</button>
  {#if open}
    <span
      class="footnote-body"
      bind:this={bodyEl}
      style:left={adjustedLeft}
      style:--arrow-left={arrowLeft}
    >
      <span class="footnote-text">{@html text}</span>
      <button class="footnote-close" on:click={toggle} aria-label="Close footnote">&times;</button>
    </span>
  {/if}
</span>

<style>
  .footnote-wrapper {
    position: relative;
    display: inline;
  }

  .footnote-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #d45d5d;
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 1.2em;
    height: 1.2em;
    font-size: 0.7em;
    font-weight: 700;
    cursor: pointer;
    vertical-align: super;
    line-height: 1;
    padding: 0;
    margin: 0 0.1em;
    font-family: DM Sans, sans-serif;
  }

  .footnote-marker:hover {
    background: #b03a3a;
  }

  .footnote-body {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: #2a2a3e;
    color: #f0f0f0;
    padding: 0.7rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    line-height: 1.5;
    width: max-content;
    max-width: min(400px, 90vw);
    z-index: 100;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  @media (min-width: 500px) {
    .footnote-body {
      top: auto;
      bottom: calc(100% + 8px);
    }
  }

  .footnote-body::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: var(--arrow-left, 50%);
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-bottom-color: #2a2a3e;
  }

  @media (min-width: 500px) {
    .footnote-body::after {
      top: 100%;
      bottom: auto;
      border-bottom-color: transparent;
      border-top-color: #2a2a3e;
    }
  }

  .footnote-text {
    display: inline;
  }

  .footnote-text :global(a) {
    color: #f0a0a0;
    text-decoration: underline;
  }

  .footnote-text :global(a:hover) {
    color: #ffcccc;
  }

  .footnote-close {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0 0 0 0.5rem;
    vertical-align: middle;
    line-height: 1;
  }

  .footnote-close:hover {
    color: #fff;
  }
</style>
