<!--
  Marimekko (variable-width stacked bar) of global GHG emissions from food.
  Column width = share of total food emissions; cell height within a column
  = share of that group's emissions.

  Data: /data/food-emissions-treemap.csv (kept in sync with
  data/food-emissions-treemap.csv at the project root). Values transcribed
  from emissions_from_animals_and_human_food.png — Our World in Data /
  Poore & Nemecek 2018.
-->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { legumeColors } from '../palette.js';
  import csvRaw from '../data/food-emissions-treemap.csv?raw';

  let svgEl = $state();
  let wrapEl = $state();
  let width = $state(900);
  let height = $state(520);
  let rows = $state([]);

  const GROUP_ORDER = ['Animal-linked', 'Plant for humans', 'Supply chain'];

  onMount(() => {
    rows = d3.csvParse(csvRaw, (d) => ({
      group: d.group,
      leaf: d.leaf,
      value: +d.value_pct,
      note: d.note || '',
    }));

    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      width = r.width;
      height = Math.max(420, Math.min(580, r.width * 0.6));
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

    const colors = legumeColors();
    const groupColor = {
      'Animal-linked': colors.kidney,
      'Plant for humans': colors.duPuy,
      'Supply chain': colors.chickpea,
    };

    const margin = { top: 56, right: 16, bottom: 28, left: 16 };
    const columnGap = 8;
    const cellGap = 2;
    const w = Math.max(0, width - margin.left - margin.right);
    const h = Math.max(0, height - margin.top - margin.bottom);

    // Group rows and compute totals
    const grouped = d3.group(rows, (d) => d.group);
    const totals = new Map(
      GROUP_ORDER.map((g) => [g, d3.sum(grouped.get(g) || [], (d) => d.value)]),
    );
    const grandTotal = d3.sum([...totals.values()]);

    const availableW = w - columnGap * (GROUP_ORDER.length - 1);

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Fit an SVG <text> to a max pixel width: measure once, then apply
    // textLength + lengthAdjust='spacingAndGlyphs' to compress if needed.
    // Compressing only when needed keeps wide columns at natural metrics.
    const fitText = (sel, maxW) => {
      const node = sel.node();
      if (!node) return;
      const actual = node.getComputedTextLength();
      if (actual > maxW && maxW > 0) {
        sel.attr('textLength', maxW).attr('lengthAdjust', 'spacingAndGlyphs');
      }
    };

    let xCursor = 0;
    GROUP_ORDER.forEach((groupName) => {
      const groupCells = (grouped.get(groupName) || []).sort(
        (a, b) => d3.descending(a.value, b.value),
      );
      const colTotal = totals.get(groupName);
      const colW = (colTotal / grandTotal) * availableW;
      const color = groupColor[groupName];

      const col = g.append('g').attr('transform', `translate(${xCursor},0)`);

      // group header (above column) — compress if it would overflow the column
      const header = col
        .append('text')
        .attr('x', 0)
        .attr('y', -28)
        .attr('fill', 'var(--text-on-light)')
        .style('font-family', 'var(--sans)')
        .style('font-size', '11px')
        .style('font-weight', '700')
        .style('letter-spacing', '0.1em')
        .style('text-transform', 'uppercase')
        .text(groupName);
      fitText(header, colW);

      col
        .append('text')
        .attr('x', 0)
        .attr('y', -8)
        .attr('fill', color)
        .style('font-family', 'var(--sans)')
        .style('font-size', '20px')
        .style('font-weight', '700')
        .text(`${colTotal}%`);

      // cells stacked vertically
      let yCursor = 0;
      groupCells.forEach((cell, idx) => {
        const cellH = (cell.value / colTotal) * h - (idx === groupCells.length - 1 ? 0 : cellGap);
        const cellGroup = col.append('g').attr('transform', `translate(0,${yCursor})`);

        cellGroup
          .append('rect')
          .attr('width', colW)
          .attr('height', cellH)
          .attr('fill', color)
          .attr('opacity', 0.85 + idx * 0.04) // mild shade variation across stack
          .attr('rx', 3);

        cellGroup.append('title').text(`${cell.leaf} — ${cell.value}% of food emissions`);

        const padL = 10;
        const padR = 6;
        const innerW = Math.max(0, colW - padL - padR);

        // inline labels when there is room (need both height and a usable width).
        // 48px is the smallest cell that fits leaf (baseline y=22) + value (y=40,
        // 14px font) without the value descender clipping the cell bottom.
        if (cellH >= 48 && innerW >= 70) {
          const leafLabel = cellGroup
            .append('text')
            .attr('x', padL)
            .attr('y', 22)
            .attr('fill', 'var(--text-on-dark)')
            .style('font-family', 'var(--sans)')
            .style('font-size', colW > 200 ? '14px' : '12px')
            .style('font-weight', '600')
            .text(cell.leaf);
          fitText(leafLabel, innerW);

          cellGroup
            .append('text')
            .attr('x', padL)
            .attr('y', colW > 200 ? 44 : 40)
            .attr('fill', 'var(--text-on-dark)')
            .style('font-family', 'var(--sans)')
            .style('font-size', colW > 200 ? '18px' : '14px')
            .style('font-weight', '700')
            .text(`${cell.value}%`);
        } else if (cellH >= 18 && innerW >= 40) {
          // compact: just leaf + value on one line, fitted to the cell width.
          // Below 40px usable width text becomes unreadable — fall back to
          // the rect-only block and let the hover tooltip do the work.
          const compact = cellGroup
            .append('text')
            .attr('x', 8)
            .attr('y', cellH / 2 + 4)
            .attr('fill', 'var(--text-on-dark)')
            .style('font-family', 'var(--sans)')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .text(`${cell.leaf} · ${cell.value}%`);
          fitText(compact, Math.max(0, colW - 12));
        }

        yCursor += cellH + cellGap;
      });

      xCursor += colW + columnGap;
    });

    // bottom note explaining the axis
    g.append('text')
      .attr('x', w / 2)
      .attr('y', h + 22)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-on-light-muted)')
      .style('font-family', 'var(--sans)')
      .style('font-size', '11px')
      .style('font-style', 'italic')
      .text('Column width = share of total food emissions · cell height = share within group');
  }
</script>

<figure class="chart" bind:this={wrapEl}>
  <figcaption class="cap">
    <span class="subtitle">Global greenhouse gas emissions from food</span>
    <span class="title">Animal-linked sources account for more than half of food emissions</span>
  </figcaption>
  <svg bind:this={svgEl}></svg>
  <p class="source">
    Total food emissions ≈ 26% of global GHG (52.3 Gt CO₂-eq, 2010 avg). Source:
    <a
      href="https://ourworldindata.org/food-ghg-emissions"
      target="_blank"
      rel="noopener"
    >Our World in Data</a> /
    <a
      href="https://www.science.org/doi/10.1126/science.aaq0216"
      target="_blank"
      rel="noopener"
    >Poore &amp; Nemecek (2018)</a>.
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
