<!--
  Simple horizontal bar chart of CO₂ per kg of food, for the foods called
  out in the article: beef, chicken, pork, cheese, tofu, eggs, fish (farmed),
  peas, other pulses, nuts. Same plant/animal coloring as the rest of the
  piece; legume rows highlighted on a linen band.

  Data: /data/food-emissions-supply-chain.csv  (total = sum of stage cols)
-->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { legumeColors, chart as chartTokens } from '../palette.js';
  import csvRaw from '../data/food-emissions-supply-chain.csv?raw';

  let svgEl = $state();
  let wrapEl = $state();
  let width = $state(800);
  let height = $state(460);
  let rows = $state([]);

  const FOODS = [
    { key: 'Beef (beef herd)', label: 'Beef', kind: 'animal' },
    { key: 'Cheese', label: 'Cheese', kind: 'animal' },
    { key: 'Pig Meat', label: 'Pork', kind: 'animal' },
    { key: 'Poultry Meat', label: 'Chicken', kind: 'animal' },
    { key: 'Fish (farmed)', label: 'Fish (farmed)', kind: 'animal' },
    { key: 'Eggs', label: 'Eggs', kind: 'animal' },
    { key: 'Tofu', label: 'Tofu', kind: 'plant' },
    { key: 'Nuts', label: 'Nuts', kind: 'plant' },
    { key: 'Peas', label: 'Peas', kind: 'plant' },
    { key: 'Other Pulses', label: 'Beans & lentils', kind: 'plant' },
  ];

  const STAGES = ['Land use change', 'Farm', 'Animal feed', 'Processing', 'Transport', 'Retail', 'Packaging', 'Losses'];

  onMount(() => {
    const raw = d3.csvParse(csvRaw);
    const byEntity = new Map(raw.map((r) => [r.Entity, r]));

    rows = FOODS.map((f) => {
      const r = byEntity.get(f.key);
      if (!r) return null;
      const total = STAGES.reduce((acc, s) => acc + (+r[s] || 0), 0);
      return { ...f, total };
    }).filter(Boolean);

    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      width = r.width;
      height = Math.max(420, Math.min(560, r.width * 0.7));
      draw();
    });
    ro.observe(wrapEl);
    draw();
    return () => ro.disconnect();
  });

  $effect(() => {
    rows;
    width;
    height;
    draw();
  });

  function draw() {
    if (!svgEl || rows.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const margin = { top: 16, right: 72, bottom: 40, left: 124 };
    const w = Math.max(0, width - margin.left - margin.right);
    const h = Math.max(0, height - margin.top - margin.bottom);

    const colors = legumeColors();
    const tokens = chartTokens();
    const sorted = [...rows].sort((a, b) => d3.descending(a.total, b.total));

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(sorted, (d) => d.total) * 1.05])
      .range([0, w]);

    const y = d3
      .scaleBand()
      .domain(sorted.map((d) => d.label))
      .range([0, h])
      .padding(0.22);

    const colorFor = (kind) =>
      kind === 'animal' ? colors.kidney : colors.duPuy;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // x axis
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5))
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').attr('stroke', tokens.grid))
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', tokens.axis)
          .style('font-family', 'var(--sans)')
          .style('font-size', '12px'),
      );

    g.append('text')
      .attr('x', w / 2)
      .attr('y', h + 34)
      .attr('text-anchor', 'middle')
      .attr('fill', tokens.axis)
      .style('font-family', 'var(--sans)')
      .style('font-size', '12px')
      .text('kg CO₂eq per kg of food');

    // category labels
    g.selectAll('text.cat')
      .data(sorted)
      .join('text')
      .attr('class', 'cat')
      .attr('x', -12)
      .attr('y', (d) => y(d.label) + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--text-on-light)')
      .style('font-family', 'var(--sans)')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .text((d) => d.label);

    // bars
    g.selectAll('rect.bar')
      .data(sorted)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', (d) => y(d.label))
      .attr('width', (d) => x(d.total))
      .attr('height', y.bandwidth())
      .attr('fill', (d) => colorFor(d.kind))
      .attr('rx', 3);

    // value labels at the end of each bar
    g.selectAll('text.val')
      .data(sorted)
      .join('text')
      .attr('class', 'val')
      .attr('x', (d) => x(d.total) + 8)
      .attr('y', (d) => y(d.label) + y.bandwidth() / 2)
      .attr('dominant-baseline', 'middle')
      .attr('fill', (d) => colorFor(d.kind))
      .style('font-family', 'var(--sans)')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text((d) => d.total.toFixed(1));
  }
</script>

<figure class="chart" bind:this={wrapEl}>
  <figcaption class="cap">
    <span class="subtitle">CO₂ per kilogram of food</span>
    <span class="title">Plant-based products are way lower in emissions</span>
  </figcaption>
  <svg bind:this={svgEl}></svg>
  <p class="source">
    Source:
    <a
      href="https://www.science.org/doi/10.1126/science.aaq0216"
      target="_blank"
      rel="noopener"
    >Poore &amp; Nemecek (2018)</a>, processed by
    <a
      href="https://ourworldindata.org/grapher/food-emissions-supply-chain"
      target="_blank"
      rel="noopener"
    >Our World in Data</a> &mdash; sum of land-use change, farm, feed, processing,
    transport, retail, packaging and losses.
  </p>
</figure>

<style>
  .chart {
    width: 100%;
    margin: 0;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  /* caption styles inherited from .chart .cap rules in app.css */
</style>
