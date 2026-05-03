<script lang="ts">
  import * as d3 from 'd3';

  let n = $state(60);
  let freq = $state(0.4);

  const data = $derived(d3.range(n).map((i) => Math.sin(i * freq) * 40 + 50 + (i % 7)));

  const width = 720;
  const height = 360;
  const margin = { top: 16, right: 16, bottom: 28, left: 36 };

  const x = $derived(
    d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([margin.left, width - margin.right])
  );
  const y = $derived(
    d3
      .scaleLinear()
      .domain(d3.extent(data) as [number, number])
      .nice()
      .range([height - margin.bottom, margin.top])
  );
  const area = $derived(
    d3
      .area<number>()
      .x((_, i) => x(i))
      .y0(height - margin.bottom)
      .y1((d) => y(d))
      .curve(d3.curveMonotoneX)(data) ?? ''
  );
</script>

<section class="piece">
  <div class="controls">
    <label>
      points <input type="range" min="10" max="200" bind:value={n} /> {n}
    </label>
    <label>
      frequency <input type="range" min="0.05" max="1.5" step="0.01" bind:value={freq} /> {freq.toFixed(
        2
      )}
    </label>
  </div>

  <svg viewBox="0 0 {width} {height}" role="img" aria-label="interactive sine demo">
    <path d={area} fill="#111" fill-opacity="0.08" stroke="#111" stroke-width="1.25" />
  </svg>

  <p class="caption">
    An interactive placeholder. Real whole-page pieces (<code>missingvoters</code>,
    <code>chartgarden</code>, …) will replace this component.
  </p>
</section>

<style>
  .piece {
    margin: 1.5rem 0;
  }
  .controls {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
    background: #fff;
    border: 1px solid #eee;
  }
  .caption {
    color: #666;
    font-size: 0.9rem;
  }
</style>
