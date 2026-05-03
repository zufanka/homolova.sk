<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import csvRaw from '../data/brexit_poll.csv?raw';

  let svg;
  let mounted = false;

  const margin = { top: 55, right: 60, bottom: 60, left: 35 };
  const width = 640;
  const height = 500;

  const colorRight = '#d45d5d'; // red
  const colorWrong = '#7a8b99'; // gray

  const brexitDate = new Date(2020, 0, 31); // 31 Jan 2020

  const ariaLabel = 'Line chart showing British public opinion on Brexit from 2016 to 2025. Two lines track the percentage who think leaving was right (gray) versus wrong (red). After Brexit in January 2020, the "wrong to leave" sentiment steadily increased, overtaking "right to leave" and reaching a higher level by 2025.';

  function parseData() {
    // Strip BOM if present
    const clean = csvRaw.replace(/^\uFEFF/, '');
    const parsed = d3.csvParse(clean);
    const dateCol = parsed.columns[0]; // handles any leftover BOM in column name
    return parsed.map(d => ({
      date: d3.timeParse('%d/%m/%Y')(d[dateCol]),
      right: +d['Right to leave'],
      wrong: +d['Wrong to leave']
    }))
    .filter(d => d.date)
    .sort((a, b) => a.date - b.date);
  }

  function renderChart() {
    if (!svg) return;

    const sel = d3.select(svg);
    sel.selectAll('*').remove();

    const data = parseData();
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([margin.left, margin.left + chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 65])
      .range([margin.top + chartHeight, margin.top]);

    const g = sel.append('g');

    // Gridlines
    const yTicks = [0, 10, 20, 30, 40, 50, 60];
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', margin.left)
      .attr('x2', margin.left + chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e5e5e5')
      .attr('stroke-width', 1);

    // Y-axis labels
    g.selectAll('.y-label')
      .data(yTicks)
      .enter()
      .append('text')
      .attr('x', margin.left - 8)
      .attr('y', d => yScale(d))
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', '16px')
      .style('fill', '#888')
      .style('font-family', 'DM Sans, sans-serif')
      .text(d => d);

    // X-axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeYear.every(1))
      .tickFormat(d3.timeFormat('%Y'))
      .tickSize(0);

    g.append('g')
      .attr('transform', `translate(0,${margin.top + chartHeight})`)
      .call(xAxis)
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .attr('dy', '1.2em')
      .style('font-size', '16px')
      .style('fill', '#888')
      .style('font-family', 'DM Sans, sans-serif');

    // Brexit vertical line
    g.append('line')
      .attr('x1', xScale(brexitDate))
      .attr('x2', xScale(brexitDate))
      .attr('y1', yScale(0))
      .attr('y2', yScale(60))
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3');

    g.append('text')
      .attr('x', xScale(brexitDate))
      .attr('y', yScale(0) - 20 )
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('fill', '#999')
      .style('font-family', 'DM Sans, sans-serif')
      .text('Britain leaves the EU');

    // Line generators
    const lineRight = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.right));

    const lineWrong = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.wrong));

    // Draw lines
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', colorRight)
      .attr('stroke-width', 2)
      .attr('d', lineRight);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', colorWrong)
      .attr('stroke-width', 2)
      .attr('d', lineWrong);

    // End labels
    const last = data[data.length - 1];

    g.append('text')
      .attr('x', xScale(last.date) + 8)
      .attr('y', yScale(last.right))
      .attr('dy', '0.35em')
      .style('font-size', '18px')
      .style('font-weight', '700')
      .style('fill', colorRight)
      .style('font-family', 'DM Sans, sans-serif')
      .text(last.right);

    g.append('text')
      .attr('x', xScale(last.date) + 8)
      .attr('y', yScale(last.wrong))
      .attr('dy', '0.35em')
      .style('font-size', '18px')
      .style('font-weight', '700')
      .style('fill', colorWrong)
      .style('font-family', 'DM Sans, sans-serif')
      .text(last.wrong);

    // Legend
    const legendY = margin.top - 4;
    const legendItems = [
      { label: 'Right to leave', color: colorRight },
      { label: 'Wrong to leave', color: colorWrong }
    ];
    let legendX = margin.left;

    legendItems.forEach(item => {
      g.append('line')
        .attr('x1', legendX)
        .attr('x2', legendX + 20)
        .attr('y1', legendY)
        .attr('y2', legendY)
        .attr('stroke', item.color)
        .attr('stroke-width', 4);

      g.append('text')
        .attr('x', legendX + 26)
        .attr('y', legendY)
        .attr('dy', '0.35em')
        .style('font-size', '18px')
        .style('fill', '#444')
        .style('font-family', 'DM Sans, sans-serif')
        .text(item.label);

      legendX += 150;
    });
  }

  onMount(() => {
    mounted = true;
    renderChart();
  });
</script>

<div class="brexit-chart">
  <div class="brexit-header">
    <p class="brexit-question">In hindsight, do you think Britain was right or wrong to vote to leave the European Union? %</p>
  </div>
  <svg
    bind:this={svg}
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    style="max-width: 100%; height: auto;"
    role="img"
    aria-label={ariaLabel}
  ></svg>
  <p class="brexit-source">Source: <a target="_blank" href="https://yougov.co.uk/politics/articles/51484-how-do-britons-feel-about-brexit-five-years-on">YouGov</a></p>
</div>

<style>
  .brexit-chart {
    max-width: 640px;
    margin: 1.5rem auto;
  }

  .brexit-header {
    margin-bottom: 0.25rem;
  }

  .brexit-question {
    font-size: 0.85rem;
    color: #868686;
    margin: 0;
    line-height: 1.4;
    font-family: DM Sans, sans-serif;
  }

  .brexit-source {
    font-size: 0.7rem;
    line-height: 1.4;
    color: #868686;
    margin: 0.5rem 0 0 0;
    text-align: right;
    font-family: DM Sans, sans-serif;
  }
</style>
