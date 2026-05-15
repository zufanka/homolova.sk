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
  // Cells too narrow to label inline (value shown in-cell, name listed below).
  let breakdownGroups = $state([]);

  const GROUP_ORDER = ['Animals', 'Food for humans', 'Supply chain'];

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
      'Animals': colors.kidney,
      'Food for humans': colors.duPuy,
      'Supply chain': colors.adzuki,
    };

    const margin = { top: 74, right: 16, bottom: 12, left: 16 };
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

    // Hidden text node reused to measure strings at a given font size, so we
    // can word-wrap labels to the exact column width instead of compressing
    // them with textLength (which looked squeezed on narrow screens).
    const measurer = g
      .append('text')
      .attr('visibility', 'hidden')
      .style('font-family', 'var(--sans)')
      .style('font-weight', '600');
    const measure = (str, fs) => {
      measurer.style('font-size', `${fs}px`).text(str);
      return measurer.node().getComputedTextLength();
    };
    const wrap = (str, maxW, fs) => {
      const words = str.split(/\s+/);
      const lines = [];
      let cur = '';
      for (const word of words) {
        const trial = cur ? `${cur} ${word}` : word;
        if (!cur || measure(trial, fs) <= maxW) {
          cur = trial;
        } else {
          lines.push(cur);
          cur = word;
        }
      }
      if (cur) lines.push(cur);
      return lines;
    };
    const maxLineW = (lines, fs) =>
      d3.max(lines, (l) => measure(l, fs)) ?? 0;

    // Word-wrap an uppercase group header to the column width instead of
    // compressing it. Measures with the header's own weight/spacing, then
    // restores the measurer to the body-label defaults.
    const wrapHeader = (str, maxW) => {
      measurer
        .style('font-size', '11px')
        .style('font-weight', '700')
        .style('letter-spacing', '0.1em');
      const words = str.toUpperCase().split(/\s+/);
      const lines = [];
      let cur = '';
      for (const wd of words) {
        const trial = cur ? `${cur} ${wd}` : wd;
        measurer.text(trial);
        if (!cur || measurer.node().getComputedTextLength() <= maxW) {
          cur = trial;
        } else {
          lines.push(cur);
          cur = wd;
        }
      }
      if (cur) lines.push(cur);
      measurer.style('font-weight', '600').style('letter-spacing', null);
      return lines;
    };

    // Render a wrapped leaf label + value stacked at the top of a cell, or a
    // single fitted "leaf · value" line, or (last resort) a centred value.
    // Returns true when the leaf name was shown, false when only the value was.
    const labelCell = (cellGroup, cell, colW, cellH) => {
      const padL = 10;
      const padR = 6;
      const innerW = Math.max(0, colW - padL - padR);
      const big = colW > 200;

      const valueOnly = () => {
        if (cellH < 14 || colW < 22) return;
        cellGroup
          .append('text')
          .attr('x', colW / 2)
          .attr('y', cellH / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', 'var(--text-on-dark)')
          .style('font-family', 'var(--sans)')
          .style('font-size', big ? '15px' : '13px')
          .style('font-weight', '700')
          .text(`${cell.value}%`);
      };

      // 1. Wrapped leaf name + value, shrinking the font until the block fits.
      const sizes = big ? [14, 13, 12, 11] : [12, 11, 10];
      for (const fs of sizes) {
        const lineH = fs + 3;
        const lines = wrap(cell.leaf, innerW, fs);
        const valueFs = Math.round(fs * 1.3);
        const blockH = lines.length * lineH + valueFs + 6;
        if (blockH <= cellH - 8 && maxLineW(lines, fs) <= innerW && innerW > 0) {
          let y = fs + 6;
          for (const line of lines) {
            cellGroup
              .append('text')
              .attr('x', padL)
              .attr('y', y)
              .attr('fill', 'var(--text-on-dark)')
              .style('font-family', 'var(--sans)')
              .style('font-size', `${fs}px`)
              .style('font-weight', '600')
              .text(line);
            y += lineH;
          }
          cellGroup
            .append('text')
            .attr('x', padL)
            .attr('y', y + valueFs - 4)
            .attr('fill', 'var(--text-on-dark)')
            .style('font-family', 'var(--sans)')
            .style('font-size', `${valueFs}px`)
            .style('font-weight', '700')
            .text(`${cell.value}%`);
          return true;
        }
      }

      // 2. Short cell but wide enough for one fitted "leaf · value" line.
      const oneLine = `${cell.leaf} · ${cell.value}%`;
      for (const fs of [12, 11, 10]) {
        if (cellH >= fs + 8 && measure(oneLine, fs) <= innerW && innerW > 0) {
          cellGroup
            .append('text')
            .attr('x', padL)
            .attr('y', cellH / 2 + fs / 3)
            .attr('fill', 'var(--text-on-dark)')
            .style('font-family', 'var(--sans)')
            .style('font-size', `${fs}px`)
            .style('font-weight', '600')
            .text(oneLine);
          return true;
        }
      }

      // 3. Too narrow for any word — value in the cell, name listed below.
      valueOnly();
      return false;
    };

    const hidden = [];
    let xCursor = 0;
    GROUP_ORDER.forEach((groupName) => {
      const groupCells = (grouped.get(groupName) || []).sort(
        (a, b) => d3.descending(a.value, b.value),
      );
      const colTotal = totals.get(groupName);
      const colW = (colTotal / grandTotal) * availableW;
      const color = groupColor[groupName];

      const col = g.append('g').attr('transform', `translate(${xCursor},0)`);

      // group header (above column) — wrap onto multiple lines if it would
      // overflow the column, rather than compressing it.
      const headerLines = wrapHeader(groupName, colW);
      headerLines.forEach((line, li) => {
        const baseline = -30 - (headerLines.length - 1 - li) * 15;
        col
          .append('text')
          .attr('x', 0)
          .attr('y', baseline)
          .attr('fill', 'var(--text-on-light)')
          .style('font-family', 'var(--sans)')
          .style('font-size', '11px')
          .style('font-weight', '700')
          .style('letter-spacing', '0.1em')
          .text(line);
      });

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

        const named = labelCell(cellGroup, cell, colW, cellH);
        if (!named) {
          hidden.push({
            group: groupName,
            leaf: cell.leaf,
            value: cell.value,
            color,
            isLast: groupName === GROUP_ORDER[GROUP_ORDER.length - 1],
            // geometry in `g` space, for the right-rail callout connectors
            rightX: xCursor + colW,
            midY: yCursor + cellH / 2,
          });
        }

        yCursor += cellH + cellGap;
      });

      xCursor += colW + columnGap;
    });

    // Right-rail callouts for cells too narrow to label in the last column
    // (Supply chain): a connector leaves the cell's right edge, runs down a
    // rail at the chart's right edge, and ends in a tag stacked below.
    const railCells = hidden.filter((d) => d.isLast);
    const otherCells = hidden.filter((d) => !d.isLast);

    let extraH = 0;
    if (railCells.length > 0) {
      const tagH = 24;
      const tagGap = 8;
      const topGap = 26;
      const railX = w; // right boundary of the column area
      const tagsTop = h + topGap;

      const layer = g.append('g');
      railCells.forEach((d, i) => {
        d.tagY = tagsTop + i * (tagH + tagGap) + tagH / 2;
        const label = `${d.leaf} ${d.value}%`;
        const tagW = measure(label, 12) + 22;
        const tagX = railX - tagW; // tag right edge sits on the rail

        layer
          .append('path')
          .attr('d', `M${d.rightX},${d.midY} H${railX} V${d.tagY} H${tagX + tagW}`)
          .attr('fill', 'none')
          .attr('stroke', d.color)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.65);
        layer
          .append('circle')
          .attr('cx', d.rightX)
          .attr('cy', d.midY)
          .attr('r', 2.5)
          .attr('fill', d.color);

        const tag = layer
          .append('g')
          .attr('transform', `translate(${tagX},${d.tagY - tagH / 2})`);
        tag
          .append('rect')
          .attr('width', tagW)
          .attr('height', tagH)
          .attr('rx', 5)
          .attr('fill', d.color);
        tag
          .append('text')
          .attr('x', tagW / 2)
          .attr('y', tagH / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', 'var(--text-on-dark)')
          .style('font-family', 'var(--sans)')
          .style('font-size', '12px')
          .style('font-weight', '600')
          .text(label);
      });
      extraH = topGap + railCells.length * (tagH + tagGap) + 6;
      svg.attr('viewBox', `0 0 ${width} ${height + extraH}`);
    }

    measurer.remove();

    // Any other too-narrow cells (rare, non-last column) fall back to text.
    breakdownGroups = GROUP_ORDER
      .map((name) => ({
        name,
        color: groupColor[name],
        items: otherCells.filter((d) => d.group === name),
      }))
      .filter((d) => d.items.length > 0);
  }
</script>

<figure class="chart" bind:this={wrapEl}>
  <figcaption class="cap">
    <span class="subtitle">Global greenhouse gas emissions from food</span>
    <span class="title">Animal-linked sources account for more than half of food emissions</span>
  </figcaption>
  <svg bind:this={svgEl}></svg>
  {#each breakdownGroups as bg}
    <p class="breakdown">
      <strong style="color:{bg.color}">{bg.name}</strong>
      {#each bg.items as it, i}{i > 0 ? ' · ' : ' — '}{it.leaf} {it.value}%{/each}
    </p>
  {/each}
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
  .breakdown {
    font-family: var(--sans);
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--text-on-light);
    margin: 0.4rem 0 0;
  }
  .breakdown strong {
    font-weight: 700;
  }
  /* caption styles inherited from .chart .cap rules in app.css */
</style>
