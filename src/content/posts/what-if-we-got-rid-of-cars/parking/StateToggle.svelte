<script lang="ts">
  /**
   * NOW / CONVERTED. Writes `view.stateKey`; the ranking, the map figures and
   * the map colours all read it. "Converted" = every surface parking lot plus
   * 60% of the calm-street area handed back as green.
   */
  import { view, type StateKey } from './state.svelte';

  const MODES: { key: StateKey; label: string }[] = [
    { key: 'now', label: 'Now' },
    { key: 'scenario', label: 'Converted' }
  ];
</script>

<div class="modeswitch" role="group" aria-label="Show the cities">
  {#each MODES as m (m.key)}
    <button
      type="button"
      class="mbtn"
      class:on={view.stateKey === m.key}
      aria-pressed={view.stateKey === m.key}
      onclick={() => (view.stateKey = m.key)}
    >
      {m.label}
    </button>
  {/each}
</div>

<style>
  .modeswitch {
    display: inline-flex;
    border: 1.5px solid var(--ink, #020202);
    background: var(--bg, #fff);
    margin: 0 0 0.7rem;
  }
  .mbtn {
    font: inherit;
    font-family: var(--sans, system-ui, sans-serif);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: none;
    border: 0;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
    color: var(--muted, #666);
  }
  .mbtn + .mbtn {
    border-left: 1.5px solid var(--ink, #020202);
  }
  .mbtn:hover {
    color: var(--ink, #020202);
  }
  .mbtn.on {
    background: var(--ink, #020202);
    color: var(--bg, #fff);
  }
</style>
