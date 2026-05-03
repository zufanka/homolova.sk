<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let { data = defaultData(), height = 200 }: { data?: number[]; height?: number } = $props();

  let el: SVGSVGElement;
  let width = $state(640);

  function defaultData() {
    return d3.range(24).map((i) => 50 + 30 * Math.sin(i / 2) + (i % 5));
  }

  onMount(() => {
    const ro = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
    });
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  });

  const margin = { top: 8, right: 8, bottom: 24, left: 32 };

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
  const line = $derived(
    d3
      .line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX)
  );
  const path = $derived(line(data) ?? '');
</script>

<div class="chart">
  <svg bind:this={el} {width} {height} viewBox="0 0 {width} {height}">
    <path d={path} fill="none" stroke="#111" stroke-width="1.5" />
    <g transform="translate(0,{height - margin.bottom})">
      {#each x.ticks(5) as t}
        <g transform="translate({x(t)},0)">
          <line y2="4" stroke="#888" />
          <text y="16" text-anchor="middle" font-size="10" fill="#666">{t}</text>
        </g>
      {/each}
    </g>
    <g transform="translate({margin.left},0)">
      {#each y.ticks(4) as t}
        <g transform="translate(0,{y(t)})">
          <line x2="-4" stroke="#888" />
          <text x="-8" dy="0.32em" text-anchor="end" font-size="10" fill="#666">{t}</text>
        </g>
      {/each}
    </g>
  </svg>
</div>

<style>
  .chart {
    width: 100%;
    margin: 1.5rem 0;
  }
  svg {
    width: 100%;
    display: block;
  }
</style>
