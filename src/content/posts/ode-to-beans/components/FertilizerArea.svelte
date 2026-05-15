<!--
  Fertilizer-dependence line chart.
  Three lines:
    – world population (total)
    – population supported without synthetic fertilizer
    – population fed thanks to synthetic fertilizer

  Data: /data/world-population-with-and-without-fertilizer.csv
  The 'without' / 'fed' columns are sparse (every ~5-10 years).
  We filter to rows where both are present and let D3 draw a smooth curve.
-->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { legumeColors, chart as chartTokens } from '../palette.js';
  import csvRaw from '../data/world-population-with-and-without-fertilizer.csv?raw';

  let svgEl = $state();
  let wrapEl = $state();
  let width = $state(800);
  let height = $state(440);
  let series = $state([]);

  onMount(() => {
    const raw = d3.csvParse(csvRaw, (d) => ({
      year: +d.Year,
      total: +d['World population'],
      without: d['World population supported without synthetic fertilizer']
        ? +d['World population supported without synthetic fertilizer']
        : null,
      fed: d['World population fed by synthetic fertilizer']
        ? +d['World population fed by synthetic fertilizer']
        : null,
    }));
    series = raw
      .filter((d) => d.without != null && d.fed != null)
      .filter((d) => d.year >= 1900);

    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      width = r.width;
      height = Math.max(340, Math.min(480, r.width * 0.55));
      draw();
    });
    ro.observe(wrapEl);
    draw();
    return () => ro.disconnect();
  });

  // Word-wrap helper: split `text` into lines so each fits within `maxWidthCh`
  // approximate-characters wide.
  function wrapWords(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length > maxChars && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = next;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  $effect(() => {
    series;
    width;
    height;
    draw();
  });

  const billions = (n) => `${(n / 1e9).toFixed(1)}B`;

  function draw() {
    if (!svgEl || series.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    // On narrow widths, drop the inline end-labels and use a legend above.
    const isMobile = width < 560;
    const rightMargin = isMobile ? 16 : 200;
    const legendLineHeight = 18;
    const legendTopPad = 8;
    const legendBottomPad = 12;
    const legendItemCount = 3;
    const legendHeight = isMobile
      ? legendTopPad + legendItemCount * legendLineHeight + legendBottomPad
      : 0;
    const margin = {
      top: 24 + legendHeight,
      right: rightMargin,
      bottom: 40,
      left: 56,
    };
    const w = Math.max(0, width - margin.left - margin.right);
    const h = Math.max(0, height - margin.top - margin.bottom);

    const colors = legumeColors();
    const tokens = chartTokens();

    const total = (d) => d.without + d.fed;
    series.forEach((d) => (d.total = total(d)));

    const x = d3
      .scaleLinear()
      .domain(d3.extent(series, (d) => d.year))
      .range([0, w]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(series, (d) => d.total) * 1.05])
      .range([h, 0]);

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-w)
          .tickFormat(() => ''),
      )
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').attr('stroke', tokens.grid));

    const line = (key) =>
      d3
        .line()
        .x((d) => x(d.year))
        .y((d) => y(d[key]))
        .curve(d3.curveMonotoneX);

    const lines = [
      { key: 'total', label: 'World population', color: 'var(--text-on-light)', weight: 700, strokeWidth: 2.5 },
      { key: 'without', label: 'Independent of synthetic fertilizer', color: colors.duPuy, weight: 600, strokeWidth: 2 },
      { key: 'fed', label: 'Depends on synthetic fertilizer', color: colors.coralLentil, weight: 600, strokeWidth: 2 },
    ];

    lines.forEach((ln) => {
      g.append('path')
        .datum(series)
        .attr('fill', 'none')
        .attr('stroke', ln.color)
        .attr('stroke-width', ln.strokeWidth)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line(ln.key));
    });

    // axes
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(6))
      .call((sel) => sel.select('.domain').attr('stroke', tokens.axis))
      .call((sel) => sel.selectAll('line').attr('stroke', tokens.axis))
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', tokens.axis)
          .style('font-family', 'var(--sans)')
          .style('font-size', '12px'),
      );

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(billions))
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').remove())
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', tokens.axis)
          .style('font-family', 'var(--sans)')
          .style('font-size', '12px'),
      );

    const last = series[series.length - 1];

    if (isMobile) {
      // Top legend on narrow screens — stacked vertically so long labels fit.
      // Offset by -margin.left so it aligns with the figure's left edge
      // (i.e. the title/subtitle) rather than the indented plot area, which
      // also reclaims that width so long labels don't get clipped.
      const legend = g
        .append('g')
        .attr('transform', `translate(${-margin.left + 2}, ${-legendHeight + legendTopPad})`);
      lines.forEach((ln, i) => {
        const item = legend
          .append('g')
          .attr('transform', `translate(0, ${i * legendLineHeight})`);
        item
          .append('rect')
          .attr('x', 0)
          .attr('y', 4)
          .attr('width', 12)
          .attr('height', 3)
          .attr('fill', ln.color);
        item
          .append('text')
          .attr('x', 18)
          .attr('y', 6)
          .attr('dominant-baseline', 'middle')
          .attr('fill', ln.color)
          .style('font-family', 'var(--sans)')
          .style('font-size', '12px')
          .style('font-weight', ln.weight)
          .text(`${ln.label} · ${billions(last[ln.key])}`);
      });
      return;
    }

    // End labels — anchored at last data point, wrapped to fit the right margin.
    const labelGap = 10;
    const lineHeight = 14;
    // Approx chars per line that fit within rightMargin minus gap.
    const maxChars = 22;

    const endPoints = lines.map((ln) => {
      const text = `${ln.label} · ${billions(last[ln.key])}`;
      const wrapped = wrapWords(text, maxChars);
      return {
        label: ln.label,
        color: ln.color,
        weight: ln.weight,
        wrapped,
        yPx: y(last[ln.key]),
      };
    });
    endPoints.sort((a, b) => a.yPx - b.yPx);

    // Stack to avoid overlap, accounting for multi-line height.
    for (let i = 1; i < endPoints.length; i += 1) {
      const prev = endPoints[i - 1];
      const cur = endPoints[i];
      const minGap = prev.wrapped.length * lineHeight + 4;
      if (cur.yPx - prev.yPx < minGap) cur.yPx = prev.yPx + minGap;
    }

    endPoints.forEach((p) => {
      const text = g
        .append('text')
        .attr('x', x(last.year) + labelGap)
        .attr('y', p.yPx)
        .attr('dominant-baseline', 'middle')
        .attr('fill', p.color)
        .style('font-family', 'var(--sans)')
        .style('font-size', '12px')
        .style('font-weight', p.weight);
      const offset = -((p.wrapped.length - 1) * lineHeight) / 2;
      p.wrapped.forEach((ln, i) => {
        text
          .append('tspan')
          .attr('x', x(last.year) + labelGap)
          .attr('dy', i === 0 ? offset : lineHeight)
          .text(ln);
      });
    });
  }
</script>

<figure class="chart" bind:this={wrapEl}>
  <figcaption class="cap">
    <span class="subtitle">World population, 1900 – 2015</span>
    <span class="title">Half the world's population is dependent on synthetic fertilizer</span>
  </figcaption>
  <svg bind:this={svgEl}></svg>
  <p class="source">
    Source:
    <a
      href="https://ourworldindata.org/how-many-people-does-synthetic-fertilizer-feed"
      target="_blank"
      rel="noopener"
    >Our World in Data &mdash; <em>How many people does synthetic fertilizer feed?</em></a>
    · sparse observations, smoothed between known years.
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
