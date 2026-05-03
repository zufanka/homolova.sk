<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  export let data = [];
  export let step = 0;
  export let stepOffset = 0;
  export let width = 600;
  export let height = 500;

  // Fade in 0.10→0.25, hold 0.25→0.65, fade out 0.65→0.80, gone before and after
  $: introOpacity = step === 0 && stepOffset >= 0.10 && stepOffset <= 0.80
    ? Math.max(0, Math.min((stepOffset - 0.10) / 0.15, (0.80 - stepOffset) / 0.15, 1))
    : 0;

  const margin = { top: 40, right: 50, bottom: 55, left: 80 };
  let svg;
  let mounted = false;

  const colorHighlight = '#d45d5d';
  const colorDimmed = '#d0d5da';
  const colorDefault = '#7a8b99';

  const easternBlock = ['EE', 'CZ', 'SI', 'HU', 'SK', 'HR', 'BG', 'LV', 'RO', 'LT', 'PL'];

  const stepDescriptions = [
    'Overview showing all EU countries. Bubble size represents total adult population. X-axis shows mobile Europeans as percentage of population, Y-axis shows absolute numbers.',
    'Highlighting Luxembourg with 37% mobile Europeans, the highest share in the EU.',
    'Highlighting Germany with 3.7 million mobile Europeans, the largest absolute number in the EU.',
    'Highlighting Spain, France, and Italy, which together host slightly more mobile Europeans than Germany.',
    'Highlighting countries where more than 4% of adults are mobile Europeans: Netherlands, Denmark, Austria, Belgium, Ireland, Malta, and Cyprus.',
    'Zooming into Eastern European countries with fewer mobile Europeans, totaling nearly 950 thousand.',
  ];

  $: ariaLabel = `Bubble chart of mobile Europeans by EU country. ${stepDescriptions[step] || stepDescriptions[0]}`;

  const fullXDomain = [0, 40];
  const fullYDomain = [1000, 5000000];

  let xScale, yScale, rScale;

  function initScales() {
    xScale = d3.scaleLinear()
      .range([margin.left, width - margin.right]);

    yScale = d3.scaleLog()
      .range([height - margin.bottom, margin.top]);

    rScale = d3.scaleSqrt()
      .domain([0, d3.max(data, d => +d.total_voting_age)])
      .range([4, 40]);
  }

  function isInView(d, config) {
    const x = +d.pct_of_voters_other_eu;
    const y = +d.other_eu_voting_age;
    const xRange = config.xDomain[1] - config.xDomain[0];
    const xPad = xRange * 0.15;
    return (
      x >= config.xDomain[0] - xPad &&
      x <= config.xDomain[1] + xPad &&
      y >= config.yDomain[0] / 1.5 &&
      y <= config.yDomain[1] * 1.5
    );
  }

  function getStepConfig(step) {
    switch (step) {
      case 0: // Overview: full chart, no highlights, axes highlighted
        return {
          xDomain: fullXDomain,
          yDomain: fullYDomain,
          isHighlighted: () => true,
          fillFn: () => colorHighlight,
          opacityFn: () => 0.7,
          strokeFn: () => '#b03a3a',
          annotations: [],
          referenceLine: null,
          highlightAxes: true,
        };

      case 1: // Scene 1a: zoom to Luxembourg region
        return {
          xDomain: [0, 40],
          yDomain: [10000, 5000000],
          isHighlighted: d => d.geo === 'LU',
          fillFn: d => d.geo === 'LU' ? colorHighlight : colorDimmed,
          opacityFn: d => d.geo === 'LU' ? 0.85 : 0.3,
          strokeFn: d => d.geo === 'LU' ? '#b03a3a' : '#bbb',
          annotations: [],
          referenceLine: null,
        };

      case 2: // Scene 1b: zoom to Germany region
        return {
          xDomain: [0, 11],
          yDomain: [1000, 5000000],
          isHighlighted: d => d.geo === 'DE',
          fillFn: d => d.geo === 'DE' ? colorHighlight : colorDimmed,
          opacityFn: d => d.geo === 'DE' ? 0.85 : 0.3,
          strokeFn: d => d.geo === 'DE' ? '#b03a3a' : '#bbb',
          annotations: [],
          referenceLine: null,
        };

      case 3: // Scene 2a: zoom to 0-11% / 1k-1.7M, highlight ES/FR/IT
        return {
          xDomain: [0, 11],
          yDomain: [1000, 1700000],
          isHighlighted: d => ['ES', 'FR', 'IT'].includes(d.geo),
          fillFn: d => ['ES', 'FR', 'IT'].includes(d.geo) ? colorHighlight : colorDimmed,
          opacityFn: d => ['ES', 'FR', 'IT'].includes(d.geo) ? 0.85 : 0.3,
          strokeFn: d => ['ES', 'FR', 'IT'].includes(d.geo) ? '#b03a3a' : '#bbb',
          annotations: [],
          referenceLine: null,
        };

      case 4: // Scene 2b: same zoom, highlight countries with >= 4%
        return {
          xDomain: [0, 11],
          yDomain: [1000, 1700000],
          isHighlighted: d => +d.pct_of_voters_other_eu >= 4,
          fillFn: d => +d.pct_of_voters_other_eu >= 4 ? colorHighlight : colorDimmed,
          opacityFn: d => +d.pct_of_voters_other_eu >= 4 ? 0.85 : 0.25,
          strokeFn: d => +d.pct_of_voters_other_eu >= 4 ? '#b03a3a' : '#bbb',
          annotations: [],
          referenceLine: 4,
        };

      case 5: // Scene 3: zoom to 0-2% / 1k-200k, eastern block
        return {
          xDomain: [0, 2],
          yDomain: [1000, 200000],
          isHighlighted: d => easternBlock.includes(d.geo),
          fillFn: d => {
            if (easternBlock.includes(d.geo)) return colorHighlight;
            return colorDimmed;
          },
          opacityFn: d => {
            if (easternBlock.includes(d.geo)) return 0.8;
            return 0.2;
          },
          strokeFn: d => {
            if (easternBlock.includes(d.geo)) return '#b03a3a';
            return '#bbb';
          },
          annotations: [],
          referenceLine: null,
        };

      default:
        return {
          xDomain: fullXDomain,
          yDomain: fullYDomain,
          isHighlighted: () => false,
          fillFn: () => colorDefault,
          opacityFn: () => 0.6,
          strokeFn: () => '#5a6a78',
          annotations: [],
          referenceLine: null,
        };
    }
  }

  function renderChart() {
    if (!svg || !data.length) return;

    const sel = d3.select(svg);
    sel.selectAll('*').remove();

    // Drop shadow filter
    const defs = sel.append('defs');
    const filter = defs.append('filter').attr('id', 'shadow');
    filter.append('feDropShadow')
      .attr('dx', 0).attr('dy', 1)
      .attr('stdDeviation', 2)
      .attr('flood-opacity', 0.08);

    const g = sel.append('g').attr('class', 'chart-group');

    g.append('g').attr('class', 'x-axis');
    g.append('g').attr('class', 'y-axis');

    // Axis labels
    g.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', (margin.left + width - margin.right) / 2)
      .attr('y', height - 8)
      .style('font-size', '12px')
      .style('fill', '#666')
      .style('font-family', 'DM Sans, sans-serif')
      .text('Mobile Europeans as % of voting-age population');

    g.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(margin.top + height - margin.bottom) / 2)
      .attr('y', 16)
      .style('font-size', '12px')
      .style('fill', '#666')
      .style('font-family', 'DM Sans, sans-serif')
      .text('Number of voting-age mobile Europeans');

    // Reference line group (behind bubbles)
    g.append('g').attr('class', 'reference-group');

    // Bubbles
    g.append('g').attr('class', 'bubbles');

    // Annotations (on top)
    g.append('g').attr('class', 'annotation-group');

    updateChart(false);
  }

  function updateChart(animate = true) {
    if (!data.length) return;

    const sel = d3.select(svg);
    const config = getStepConfig(step);
    const duration = animate ? 800 : 0;
    const t = d3.transition().duration(duration).ease(d3.easeCubicInOut);

    // Update domains
    xScale.domain(config.xDomain);
    yScale.domain(config.yDomain);

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => d + '%');

    const yAxis = d3.axisLeft(yScale)
      .tickValues(yScale.ticks().filter(d => {
        const log = Math.log10(d);
        return Number.isInteger(log) || d === 5 * Math.pow(10, Math.floor(log));
      }))
      .tickFormat(d => {
        if (d >= 1000000) return (d / 1000000).toFixed(0) + 'M';
        if (d >= 1000) return (d / 1000).toFixed(0) + 'k';
        return d;
      });

    sel.select('.x-axis')
      .transition(t)
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    sel.select('.y-axis')
      .transition(t)
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis);

    // Style axes
    sel.selectAll('.domain').style('stroke', '#ddd');
    sel.selectAll('.tick line').style('stroke', '#eee');
    sel.selectAll('.tick text')
      .style('font-size', '11px')
      .style('fill', '#888')
      .style('font-family', 'DM Sans, sans-serif');

    // Highlight axis labels on step 0
    const axisLabelColor = config.highlightAxes ? '#1a1a2e' : '#666';
    const axisLabelWeight = config.highlightAxes ? '700' : '400';
    const axisLabelSize = config.highlightAxes ? '14px' : '12px';

    sel.select('.x-label')
      .transition(t)
      .style('fill', axisLabelColor)
      .style('font-weight', axisLabelWeight)
      .style('font-size', axisLabelSize);

    sel.select('.y-label')
      .transition(t)
      .style('fill', axisLabelColor)
      .style('font-weight', axisLabelWeight)
      .style('font-size', axisLabelSize);

    // --- Reference line ---
    const refGroup = sel.select('.reference-group');
    refGroup.selectAll('*').remove();

    if (config.referenceLine !== null) {
      const lineX = xScale(config.referenceLine);

      // Shaded region
      refGroup.append('rect')
        .attr('x', lineX)
        .attr('y', margin.top)
        .attr('width', Math.max(0, width - margin.right - lineX))
        .attr('height', height - margin.bottom - margin.top)
        .attr('fill', colorHighlight)
        .attr('fill-opacity', 0)
        .transition(t)
        .attr('fill-opacity', 0.06);

      // Dashed line
      refGroup.append('line')
        .attr('x1', lineX)
        .attr('y1', margin.top)
        .attr('x2', lineX)
        .attr('y2', height - margin.bottom)
        .attr('stroke', colorHighlight)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,4')
        .attr('opacity', 0)
        .transition(t)
        .attr('opacity', 0.7);

      // Label
      refGroup.append('text')
        .attr('x', lineX + 6)
        .attr('y', margin.top - 6)
        .text(config.referenceLine + '%')
        .style('fill', colorHighlight)
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('font-family', 'DM Sans, sans-serif')
        .attr('opacity', 0)
        .transition(t)
        .attr('opacity', 0.8);
    }

    // --- Bubbles ---
    const bubblesGroup = sel.select('.bubbles');

    let groups = bubblesGroup.selectAll('.bubble-group')
      .data(data, d => d.geo);

    // Enter
    const enter = groups.enter()
      .append('g')
      .attr('class', 'bubble-group')
      .attr('transform', d => `translate(${xScale(+d.pct_of_voters_other_eu)},${yScale(+d.other_eu_voting_age)})`);

    enter.append('circle')
      .attr('r', 0)
      .attr('fill', d => config.fillFn(d))
      .attr('fill-opacity', d => config.opacityFn(d))
      .attr('stroke', d => config.strokeFn(d))
      .attr('stroke-width', 1.5)
      .style('filter', 'url(#shadow)')
      .transition(t)
      .attr('r', d => rScale(+d.total_voting_age));

    enter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', d => rScale(+d.total_voting_age) < 12 ? '8px' : '10px')
      .style('font-weight', '600')
      .style('fill', '#2a2a3e')
      .style('pointer-events', 'none')
      .style('font-family', 'DM Sans, sans-serif')
      .text(d => d.geo);

    // Merge
    groups = enter.merge(groups);

    // Update positions + styles
    groups.transition(t)
      .attr('transform', d => {
        const inView = isInView(d, config);
        if (!inView) {
          // Park off-screen
          const x = +d.pct_of_voters_other_eu;
          const y = +d.other_eu_voting_age;
          const px = x > config.xDomain[1] ? width + 50 : x < config.xDomain[0] ? -50 : xScale(x);
          const py = y > config.yDomain[1] ? -50 : y < config.yDomain[0] ? height + 50 : yScale(y);
          return `translate(${px},${py})`;
        }
        return `translate(${xScale(+d.pct_of_voters_other_eu)},${yScale(+d.other_eu_voting_age)})`;
      });

    groups.select('circle')
      .transition(t)
      .attr('r', d => isInView(d, config) ? rScale(+d.total_voting_age) : 0)
      .attr('fill', d => config.fillFn(d))
      .attr('fill-opacity', d => isInView(d, config) ? config.opacityFn(d) : 0)
      .attr('stroke', d => config.strokeFn(d));

    groups.select('text')
      .transition(t)
      .style('opacity', d => {
        if (!isInView(d, config)) return 0;
        return config.opacityFn(d) > 0.3 ? 1 : 0.3;
      });

    // --- Annotations ---
    const annotGroup = sel.select('.annotation-group');
    annotGroup.selectAll('*').remove();

    if (config.annotations && config.annotations.length > 0) {
      config.annotations.forEach(annot => {
        const annotData = data.find(d => d.geo === annot.code);
        if (!annotData) return;

        const ax = xScale(+annotData.pct_of_voters_other_eu);
        const ay = yScale(+annotData.other_eu_voting_age);
        const r = rScale(+annotData.total_voting_age);

        const endX = ax + annot.dx;
        const endY = ay + annot.dy;

        // Connector line
        annotGroup.append('line')
          .attr('x1', ax + (annot.dx > 0 ? r + 2 : -r - 2))
          .attr('y1', ay)
          .attr('x2', endX)
          .attr('y2', endY)
          .attr('stroke', colorHighlight)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0)
          .transition(t)
          .attr('opacity', 0.9);

        // Label background
        const textEl = annotGroup.append('text')
          .attr('x', endX + (annot.dx > 0 ? 6 : -6))
          .attr('y', endY)
          .attr('dy', '.35em')
          .attr('text-anchor', annot.dx > 0 ? 'start' : 'end')
          .style('font-size', '13px')
          .style('font-weight', '700')
          .style('fill', colorHighlight)
          .style('font-family', 'DM Sans, sans-serif')
          .text(annot.text)
          .attr('opacity', 0)
          .transition(t)
          .attr('opacity', 1);
      });
    }
  }

  let prevWidth = width;
  let prevHeight = height;
  let prevStep = step;

  onMount(() => {
    mounted = true;
    initScales();
    renderChart();
  });

  $: if (mounted) {
    if (width !== prevWidth || height !== prevHeight) {
      prevWidth = width;
      prevHeight = height;
      initScales();
      renderChart();
    } else if (step !== prevStep) {
      prevStep = step;
      updateChart(true);
    }
  }
</script>

<div class="chart-container" style="max-width: {width}px;">
  <svg
    bind:this={svg}
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    style="max-width: 100%; height: auto; overflow: visible;"
    role="img"
    aria-label={ariaLabel}
  >
  </svg>
  {#if step === 0}
    <div class="chart-intro-annotation" style="opacity: {introOpacity}; visibility: {introOpacity > 0 ? 'visible' : 'hidden'};">
      <p><i>Bubble size</i> shows the <span class="hl">total adult population</span>. The <i>vertical line</i> shows the <span class="hl">amount</span> of mobile Europeans; the <i>horizontal line</i> shows their <span class="hl">share</span> in the country.</p>
    </div>
  {/if}
  <div class="chart-notes-row">
    <span class="chart-notes">Notes: Voting age is 18 in most EU countries.</span>
    <span class="chart-notes">Data: Eurostat 2024</span>
  </div>
</div>

<style>
  .chart-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .chart-intro-annotation {
    display: none;
  }

  .chart-intro-annotation .hl {
    color: #d45d5d;
    font-weight: 700;
  }

  @media (max-width: 768px) {
    .chart-intro-annotation {
      display: block;
      position: absolute;
      top: 0.5rem;
      right: 1rem;
      max-width: 45%;
      font-size: 0.85rem;
      line-height: 1.5;
      color: #2a2a3e;
      font-family: 'DM Sans', sans-serif;
      pointer-events: none;
      transition: opacity 0.15s ease;
    }

    .chart-intro-annotation p {
      margin: 0;
    }
  }

  .chart-notes-row {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin: 1.5rem 0 0;
    padding: 0 1rem;
    position: relative;
    z-index: 10;
    pointer-events: auto;
  }

  .chart-notes {
    font-size: 0.7rem;
    line-height: 1.4;
    color: #868686;
    font-family: DM Sans, sans-serif;
  }

  svg {
    display: block;
  }

  :global(.bubble-group) {
    cursor: default;
  }

  :global(.x-axis path, .y-axis path) {
    stroke: #ddd;
  }

  :global(.x-axis .tick line, .y-axis .tick line) {
    stroke: #eee;
  }
</style>
