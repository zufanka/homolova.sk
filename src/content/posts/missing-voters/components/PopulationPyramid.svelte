<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import pyramidAllData from '../data/pyramid_data.json';

  let svg;
  let mounted = false;
  let selectedCountry = 'EU27';

  const margin = { top: 30, right: 20, bottom: 40, left: 55 };
  const width = 600;
  const height = 620;
  const midGap = 48;

  const colorNative = '#7a8b99';
  const colorOtherEU = '#d45d5d';

  // Build sorted country list for dropdown
  const countryOptions = [
    { code: 'EU27', name: 'EU27 Total' },
    ...Object.keys(pyramidAllData)
      .filter(k => k !== 'EU27')
      .map(code => ({ code, name: pyramidAllData[code].country_name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  ];

  $: selectedCountryName = countryOptions.find(c => c.code === selectedCountry)?.name || selectedCountry;
  $: ariaLabel = `Population pyramid comparing age distribution of native population and mobile Europeans in ${selectedCountryName}. Native population shown on the left in gray, mobile Europeans on the right in red. Mobile Europeans tend to be younger, concentrated in working-age groups.`;

  function getData() {
    return pyramidAllData[selectedCountry].data;
  }

  function renderChart() {
    if (!svg) return;

    const sel = d3.select(svg);
    sel.selectAll('*').remove();

    const data = getData();
    const chartWidth = width - margin.left - margin.right;
    const sideWidth = (chartWidth - midGap) / 2;

    // Scales
    const maxPct = Math.max(
      d3.max(data, d => d.native_pct),
      d3.max(data, d => d.other_eu_pct)
    );
    const xMaxPct = Math.ceil(maxPct) + 1;

    const xScaleLeft = d3.scaleLinear()
      .domain([0, xMaxPct])
      .range([margin.left + sideWidth, margin.left]);

    const xScaleRight = d3.scaleLinear()
      .domain([0, xMaxPct])
      .range([margin.left + sideWidth + midGap, margin.left + sideWidth + midGap + sideWidth]);

    const yScale = d3.scaleBand()
      .domain(data.map(d => d.age_label))
      .range([height - margin.bottom, margin.top])
      .padding(0.12);

    const g = sel.append('g');

    // X axes — only show 5% and 10%
    const tickValues = [5, 10].filter(v => v <= xMaxPct);

    const xAxisLeft = d3.axisBottom(xScaleLeft)
      .tickValues(tickValues)
      .tickFormat(d => d + '%');

    const xAxisRight = d3.axisBottom(xScaleRight)
      .tickValues(tickValues)
      .tickFormat(d => d + '%');

    // Vertical gridlines spanning full chart height
    tickValues.forEach(tick => {
      // Left side
      g.append('line')
        .attr('x1', xScaleLeft(tick))
        .attr('x2', xScaleLeft(tick))
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1);
      // Right side
      g.append('line')
        .attr('x1', xScaleRight(tick))
        .attr('x2', xScaleRight(tick))
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1);
    });

    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxisLeft)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .selectAll('text')
      .style('font-size', '16px')
      .style('fill', '#888')
      .style('font-family', 'DM Sans, sans-serif');

    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxisRight)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .selectAll('text')
      .style('font-size', '16px')
      .style('fill', '#888')
      .style('font-family', 'DM Sans, sans-serif');

    // Age labels in the middle
    g.selectAll('.age-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'age-label')
      .attr('x', margin.left + sideWidth + midGap / 2)
      .attr('y', d => yScale(d.age_label) + yScale.bandwidth() / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .style('font-family', 'DM Sans, sans-serif')
      .text(d => d.age_label);

    // Native bars (left side, growing leftward)
    g.selectAll('.bar-native')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-native')
      .attr('x', d => xScaleLeft(d.native_pct))
      .attr('y', d => yScale(d.age_label))
      .attr('width', d => xScaleLeft(0) - xScaleLeft(d.native_pct))
      .attr('height', yScale.bandwidth())
      .attr('fill', colorNative)
      .attr('fill-opacity', 0.75)
      .attr('rx', 1);

    // Other EU bars (right side, growing rightward)
    g.selectAll('.bar-eu')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-eu')
      .attr('x', xScaleRight(0))
      .attr('y', d => yScale(d.age_label))
      .attr('width', d => xScaleRight(d.other_eu_pct) - xScaleRight(0))
      .attr('height', yScale.bandwidth())
      .attr('fill', colorOtherEU)
      .attr('fill-opacity', 0.8)
      .attr('rx', 1);

    // Legend labels
    g.append('text')
      .attr('x', margin.left)
      .attr('y', margin.top - 12)
      .style('font-size', '18px')
      .style('font-weight', '600')
      .style('fill', colorNative)
      .style('font-family', 'DM Sans, sans-serif')
      .text('Native population');

    g.append('text')
      .attr('x', width - margin.right)
      .attr('y', margin.top - 12)
      .attr('text-anchor', 'end')
      .style('font-size', '18px')
      .style('font-weight', '600')
      .style('fill', colorOtherEU)
      .style('font-family', 'DM Sans, sans-serif')
      .text('Mobile Europeans');

    // Style axis lines
    sel.selectAll('.domain').style('stroke', '#ddd');
    sel.selectAll('.tick line').style('stroke', '#eee');
  }

  function updateChart() {
    renderChart();
  }

  onMount(() => {
    mounted = true;
    renderChart();
  });

  $: if (mounted && selectedCountry) {
    updateChart();
  }
</script>

<div class="pyramid-section">
  <div class="pyramid-controls">
    <label for="country-select">Choose a country</label>
    <select id="country-select" bind:value={selectedCountry}>
      {#each countryOptions as opt}
        <option value={opt.code}>{opt.name}</option>
      {/each}
    </select>
  </div>

  <div class="pyramid-chart">
    <svg
      bind:this={svg}
      {width}
      {height}
      viewBox="0 0 {width} {height}"
      style="max-width: 100%; height: auto;"
      role="img"
      aria-label={ariaLabel}
    >
    </svg>
  </div>
  <p class="chart-source">Data: <a target="_blank" href="https://ec.europa.eu/eurostat/databrowser/view/migr_pop1ctz/default/table">Eurostat 2024</a></p>
</div>

<style>
  .pyramid-section {
    display: flex;
    flex-direction: column;
    max-width: 640px;
    margin: 0 auto;
  }

  .pyramid-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .pyramid-controls label {
    font-size: 0.9rem;
    color: #555;
    font-weight: 500;
  }

  .pyramid-controls select {
    font-family: DM Sans, sans-serif;
    font-size: 0.9rem;
    padding: 0.4rem 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    color: #2a2a3e;
    cursor: pointer;
  }

  .pyramid-controls select:focus {
    outline: none;
    border-color: #d45d5d;
  }

  .pyramid-chart {
    display: flex;
    justify-content: center;
  }

  svg {
    display: block;
  }

  .chart-source {
    align-self: flex-end;
    font-size: 0.7rem;
    line-height: 1.4;
    color: #868686;
    margin: 0.5rem 0 0;
    font-family: DM Sans, sans-serif;
  }
</style>
