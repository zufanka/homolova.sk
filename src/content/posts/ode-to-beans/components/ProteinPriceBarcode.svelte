<!--
  Protein-price barcode. One row per protein category; each product is a tick.
  Highlights the legume row.

  Data: /data/protein_prices_mpreis.csv
  Columns used: category, subtype, name, price_per_100g_protein_eur
-->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { legumeColors, chart as chartTokens } from '../palette.js';

  let svgEl = $state();
  let wrapEl = $state();
  let width = $state(800);
  let height = $state(420);
  let rows = $state([]);

  const CATEGORY_LABEL = {
    legume: 'Legumes',
    egg: 'Eggs',
    chicken: 'Chicken',
    pork: 'Pork',
    beef: 'Beef',
  };

  onMount(async () => {
    const raw = await d3.csv('/data/protein_prices_mpreis.csv', (d) => ({
      category: d.category,
      subtype: d.subtype,
      name: d.name,
      price: +d.price_per_100g_protein_eur,
    }));
    rows = raw.filter((d) => Number.isFinite(d.price) && CATEGORY_LABEL[d.category]);

    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      width = r.width;
      height = Math.max(360, Math.min(520, r.width * 0.55));
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

    const margin = { top: 16, right: 28, bottom: 48, left: 96 };
    const w = Math.max(0, width - margin.left - margin.right);
    const h = Math.max(0, height - margin.top - margin.bottom);

    const colors = legumeColors();
    const tokens = chartTokens();

    const byCat = d3.rollups(
      rows,
      (v) => ({
        items: v,
        median: d3.median(v, (d) => d.price),
      }),
      (d) => d.category,
    );
    byCat.sort((a, b) => d3.descending(a[1].median, b[1].median));
    const categories = byCat.map(([k]) => k);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(rows, (d) => d.price) * 1.05])
      .range([0, w]);

    const y = d3
      .scaleBand()
      .domain(categories)
      .range([0, h])
      .padding(0.35);

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `€${d}`))
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
      .attr('y', h + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', tokens.axis)
      .style('font-family', 'var(--sans)')
      .style('font-size', '12px')
      .text('Price per 100 g protein (€)');

    g.selectAll('g.row')
      .data(byCat)
      .join('g')
      .attr('class', 'row')
      .attr('transform', ([cat]) => `translate(0,${y(cat)})`)
      .each(function ([cat, { items, median }]) {
        const isPlant = cat === 'legume';
        const tickColor = isPlant ? colors.duPuy : colors.kidney;
        const bandH = y.bandwidth();

        const row = d3.select(this);

        row
          .append('text')
          .attr('x', -10)
          .attr('y', bandH / 2)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('fill', 'var(--text-on-light)')
          .style('font-family', 'var(--sans)')
          .style('font-size', '13px')
          .style('font-weight', '500')
          .text(CATEGORY_LABEL[cat]);

        row
          .selectAll('line.tick')
          .data(items)
          .join('line')
          .attr('class', 'tick')
          .attr('x1', (d) => x(d.price))
          .attr('x2', (d) => x(d.price))
          .attr('y1', bandH * 0.18)
          .attr('y2', bandH * 0.82)
          .attr('stroke', tickColor)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.7);

        row
          .append('line')
          .attr('class', 'median')
          .attr('x1', x(median))
          .attr('x2', x(median))
          .attr('y1', 0)
          .attr('y2', bandH)
          .attr('stroke', tickColor)
          .attr('stroke-width', 2.5)
          .attr('opacity', 1);

        row
          .append('text')
          .attr('x', x(median) + 8)
          .attr('y', -2)
          .attr('fill', tickColor)
          .style('font-family', 'var(--sans)')
          .style('font-size', '11px')
          .style('font-weight', '600')
          .text(`€${median.toFixed(2)}`);
      });
  }
</script>

<figure class="chart" bind:this={wrapEl}>
  <figcaption class="cap">
    <span class="subtitle">Price 100 g of protein, by category, in Austria</span>
    <span class="title">Legumes are by far the cheapest protein at the supermarket</span>
  </figcaption>
  <svg bind:this={svgEl}></svg>
  <p class="source">
    Source:
    <a href="https://www.mpreis.at/" target="_blank" rel="noopener">MPreis</a>
    2026, own calculations · each tick is one product, line is the category median.
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
