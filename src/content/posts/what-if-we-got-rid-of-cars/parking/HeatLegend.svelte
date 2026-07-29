<script lang="ts">
  /**
   * The heat-island key: a full-width ramp under the map.
   *
   * The ramp is the gradient the raster composites with, so distance along it
   * reads as temperature directly; both ends are labelled on the bar itself.
   * The tick marks where this city's hottest modelled cell falls on the shared
   * scale — one scale for every city, topped at the hottest cell measured in
   * any of them, so nothing is clipped and position is comparable.
   *
   * The scale top is `uhi.scale[1]` from the city's own geo file. It is never
   * hardcoded here: re-running the model with a new maximum changes the bar
   * with no code change.
   *
   * Takes no props — it reads `view.heat` (the toggle) and the `heat` store
   * that `<CityMap />` fills from the loaded geometry, so it can sit anywhere
   * under the map.
   */
  import { view } from './state.svelte';
  import { heat } from './map/heat.svelte';
  import { fmt1 } from './map/format';

  let {
    /** True for the copy `<CityMap />` renders inside its full-screen overlay.
     *  The inline copy stands down while full screen is open so the key is not
     *  duplicated. */
    fullscreen = false
  }: { fullscreen?: boolean } = $props();

  const shown = $derived(view.heat && fullscreen === view.fullscreen);
  const info = $derived(heat.info);
  const scaleTop = $derived(info?.scale?.[1] ?? 0);
  const peak = $derived(info?.max ?? null);
  const pct = $derived(
    peak != null && scaleTop > 0 ? Math.max(0, Math.min(100, (peak / scaleTop) * 100)) : null
  );
  // Near the hot end, hang the label on the other side of the tick.
  const flip = $derived(pct != null && pct > 55);
</script>

{#if shown}
  <div class="uhikey" class:fs={fullscreen}>
    {#if !heat.available}
      <span>No heat-island model for {heat.city} — outside the EEA/UrbClim coverage.</span>
    {:else if info}
      <span
        class="uhiramp"
        role="img"
        aria-label="Heat island scale, 0 to {fmt1(
          scaleTop
        )} degrees Celsius above the rural surroundings"
      >
        <span class="uhiend uhilo">0°C</span>
        <span class="uhiend uhihi">{fmt1(scaleTop)}°C</span>
        {#if pct != null && peak != null}
          <span class="uhipeak" class:flip style:left="{pct.toFixed(1)}%">
            <b>max {fmt1(peak)}°C</b>
          </span>
        {/if}
      </span>
      <p class="uhinote">
        <span class="uhilong"
          >Summer heat island, °C above the rural surroundings (UrbClim 2008–2017 model, EEA) — one
          scale for every city, topped at the hottest cell measured in any of them.</span
        >
      </p>
    {/if}
  </div>
{/if}

<style>
  .uhikey {
    font-size: 0.72rem;
    line-height: 1.35;
    color: var(--muted);
    margin: 0.4rem 0 0;
  }
  /* the ramp runs the full width of the map box, so distance along it reads as
     temperature directly; both ends are labelled on the bar itself */
  .uhiramp {
    position: relative;
    display: block;
    width: 100%;
    height: 1.15rem;
    border: 1.5px solid var(--ink);
    box-sizing: border-box;
    /* the ramp exactly as it composites on the map plate (stops at 0/25/50/75/100%) */
    background: linear-gradient(to right, #fdf5f0, #fedfc1 25%, #fec490 50%, #ed9a6d 75%, #c7795c);
  }
  .uhiend {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.66rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
    line-height: 1;
  }
  .uhilo {
    left: 0.35rem;
    color: var(--ink);
  }
  .uhihi {
    right: 0.35rem;
    color: #fff;
  }
  /* where this city's hottest modelled cell falls on the shared scale */
  .uhipeak {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2px;
    background: var(--ink);
    transform: translateX(-1px);
  }
  .uhipeak b {
    position: absolute;
    top: 50%;
    left: 0.3rem;
    transform: translateY(-50%);
    white-space: nowrap;
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--ink);
    /* the tick can land anywhere on the ramp, so halo the label for contrast */
    text-shadow:
      0 0 3px rgba(255, 255, 255, 0.9),
      0 0 6px rgba(255, 255, 255, 0.7);
  }
  /* near the hot end, hang the label on the other side of the tick */
  .uhipeak.flip b {
    left: auto;
    right: 0.3rem;
  }
  .uhinote {
    margin: 0.3rem 0 0;
  }

  @media (max-width: 899px) {
    /* inline on small screens the map is pinned to the bottom of the viewport:
       keep the key to one line (ramp + this city's peak); full screen shows the
       full wording */
    .uhikey:not(.fs) .uhilong {
      display: none;
    }
  }
</style>
