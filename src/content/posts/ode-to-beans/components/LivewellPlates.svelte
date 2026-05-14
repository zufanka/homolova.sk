<!--
  Dumbbell chart of current vs recommended (WWF Livewell) daily intake,
  for the food groups flagged include=1 in the source CSV.

  Data: /data/livewell_plates_adults_19-64.csv
-->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { legumeColors, chart as chartTokens } from '../palette.js';

  let svgEl = $state();
  let wrapEl = $state();
  let width = $state(800);
  let height = $state(540);
  let rows = $state([]);

  onMount(async () => {
    const raw = await d3.csv('/data/livewell_plates_adults_19-64.csv', (d) => ({
      name: d['Food group'],
      include: d.include === '1',
      current: +d['Current (g/d)'],
      livewell: +d['Livewell (g/d)'],
    }));
    rows = raw.filter((d) => d.include && Number.isFinite(d.current) && Number.isFinite(d.livewell));

    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      width = r.width;
      const isNarrow = r.width < 560;
      height = isNarrow
        ? Math.max(580, r.width * 1.6)
        : Math.max(440, Math.min(620, r.width * 0.75));
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

    // Desktop: right-aligned labels in a left gutter (200px fits the longest
    // label "Cereal and cereal products" without clipping the SVG viewBox).
    // Narrow: drop the gutter, put labels above each row.
    const isNarrow = width < 560;
    const margin = isNarrow
      ? { top: 80, right: 56, bottom: 40, left: 12 }
      : { top: 64, right: 88, bottom: 40, left: 200 };
    const w = Math.max(0, width - margin.left - margin.right);
    const h = Math.max(0, height - margin.top - margin.bottom);

    const colors = legumeColors();
    const tokens = chartTokens();

    const sorted = [...rows].sort((a, b) => d3.descending(a.livewell, b.livewell));

    const maxVal = d3.max(sorted, (d) => Math.max(d.current, d.livewell));
    const x = d3.scaleLinear().domain([0, maxVal * 1.05]).range([0, w]);

    const y = d3
      .scaleBand()
      .domain(sorted.map((d) => d.name))
      .range([0, h])
      .padding(isNarrow ? 0.72 : 0.45);

    // Plant-based vs animal-based food groups (the 10 include=1 rows).
    const PLANT_FOODS = new Set([
      'Cereal and cereal products',
      'Vegetables',
      'Fruit',
      'Legumes, nuts and oilseeds',
      'Sugar and confectionary',
    ]);
    const isPlant = (d) => PLANT_FOODS.has(d.name);
    const colorFor = (d) => (isPlant(d) ? colors.duPuy : colors.kidney);

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // gridlines
    g.append('g')
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickSize(h)
          .tickFormat(() => ''),
      )
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').attr('stroke', tokens.grid).attr('opacity', 0.5));

    // Desktop: right-aligned labels in left gutter. Narrow: above each row.
    g.selectAll('text.cat')
      .data(sorted)
      .join('text')
      .attr('class', 'cat')
      .attr('x', isNarrow ? 0 : -12)
      .attr('y', (d) =>
        isNarrow
          ? y(d.name) + y.bandwidth() / 2 - 18
          : y(d.name) + y.bandwidth() / 2,
      )
      .attr('text-anchor', isNarrow ? 'start' : 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--text-on-light)')
      .style('font-family', 'var(--sans)')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .text((d) => d.name);

    // connector line
    g.selectAll('line.connector')
      .data(sorted)
      .join('line')
      .attr('class', 'connector')
      .attr('x1', (d) => x(Math.min(d.current, d.livewell)))
      .attr('x2', (d) => x(Math.max(d.current, d.livewell)))
      .attr('y1', (d) => y(d.name) + y.bandwidth() / 2)
      .attr('y2', (d) => y(d.name) + y.bandwidth() / 2)
      .attr('stroke', colorFor)
      .attr('stroke-width', 2.5)
      .attr('opacity', 0.55);

    // current marker (open circle)
    g.selectAll('circle.current')
      .data(sorted)
      .join('circle')
      .attr('class', 'current')
      .attr('cx', (d) => x(d.current))
      .attr('cy', (d) => y(d.name) + y.bandwidth() / 2)
      .attr('r', 5)
      .attr('fill', 'var(--surface-parchment)')
      .attr('stroke', (d) => colorFor(d))
      .attr('stroke-width', 2);

    // livewell marker (filled)
    g.selectAll('circle.livewell')
      .data(sorted)
      .join('circle')
      .attr('class', 'livewell')
      .attr('cx', (d) => x(d.livewell))
      .attr('cy', (d) => y(d.name) + y.bandwidth() / 2)
      .attr('r', 6)
      .attr('fill', (d) => colorFor(d));

    // value label at the livewell end
    g.selectAll('text.val')
      .data(sorted)
      .join('text')
      .attr('class', 'val')
      .attr('x', (d) => x(Math.max(d.current, d.livewell)) + 12)
      .attr('y', (d) => y(d.name) + y.bandwidth() / 2)
      .attr('dominant-baseline', 'middle')
      .attr('fill', (d) => colorFor(d))
      .style('font-family', 'var(--sans)')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text((d) => {
        const delta = ((d.livewell - d.current) / d.current) * 100;
        const sign = delta >= 0 ? '+' : '';
        return `${sign}${delta.toFixed(0)}%`;
      });

    // x-axis
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d} g`))
      .call((sel) => sel.select('.domain').attr('stroke', tokens.axis))
      .call((sel) => sel.selectAll('line').attr('stroke', tokens.axis))
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
      .text('Daily intake (grams)');

    // legend — 2 rows, 2 items each
    const drawLegendItem = (parent, xPos, render, label) => {
      const item = parent.append('g').attr('transform', `translate(${xPos},0)`);
      render(item);
      item
        .append('text')
        .attr('x', 14)
        .attr('y', 4)
        .attr('fill', 'var(--text-on-light-muted)')
        .style('font-family', 'var(--sans)')
        .style('font-size', '11px')
        .text(label);
    };

    // Legend: 4 items at the top of the plot area. On narrow widths we stack
    // them vertically; on wider screens we flow two-per-row.
    const stackLegend = width < 560;
    const legendItems = [
      { render: (it) => it.append('circle').attr('r', 5).attr('fill', colors.duPuy), label: 'Plant-based foods' },
      { render: (it) => it.append('circle').attr('r', 5).attr('fill', colors.kidney), label: 'Animal-based foods' },
      { render: (it) =>
          it.append('circle')
            .attr('r', 5)
            .attr('fill', 'var(--surface-parchment)')
            .attr('stroke', 'var(--text-on-light-muted)')
            .attr('stroke-width', 2),
        label: 'Current' },
      { render: (it) => it.append('circle').attr('r', 6).attr('fill', 'var(--text-on-light-muted)'), label: 'Livewell target' },
    ];

    if (stackLegend) {
      const rowGap = 14;
      const startY = -(legendItems.length * rowGap);
      legendItems.forEach((it, i) => {
        const row = g.append('g').attr('transform', `translate(0,${startY + i * rowGap})`);
        drawLegendItem(row, 0, it.render, it.label);
      });
    } else {
      const colX = Math.min(180, w / 2);
      const rowTop = g.append('g').attr('transform', `translate(0,${-44})`);
      drawLegendItem(rowTop, 0, legendItems[0].render, legendItems[0].label);
      drawLegendItem(rowTop, colX, legendItems[2].render, legendItems[2].label);
      const rowBottom = g.append('g').attr('transform', `translate(0,${-24})`);
      drawLegendItem(rowBottom, 0, legendItems[1].render, legendItems[1].label);
      drawLegendItem(rowBottom, colX, legendItems[3].render, legendItems[3].label);
    }
  }
</script>

<figure class="chart" bind:this={wrapEl}>
  <figcaption class="cap">
    <span class="subtitle">Daily intake per adult (19 – 64), current vs WWF Livewell target</span>
    <span class="title">Eat more plants, less meat and cheese</span>
  </figcaption>
  <svg bind:this={svgEl}></svg>
  <p class="source">
    Source:
    <a
      href="https://www.wwf.org.uk/sites/default/files/2023-05/Eating_For_Net_Zero_Technical_Report.pdf"
      target="_blank"
      rel="noopener"
    >WWF Livewell project &mdash; <em>Eating For Net Zero</em></a>,
    technical report 2023. Daily intake per adult (19 – 64).
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
