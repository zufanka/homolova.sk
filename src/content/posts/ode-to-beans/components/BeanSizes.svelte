<!--
  Bean-size chart: legumes ordered smallest to largest by single-seed
  diameter (mm). D3 lays out one row per bean; image width scales with
  `sizeMm` so kidney beans visibly dominate red lentils.

  Each bean row is a focusable button. Hover or focus opens an ephemeral
  fact card; click pins it until "×" (or another bean) clears it.
-->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { beanFacts } from '../data/beans.js';
  import { chart as chartTokens } from '../palette.js';

  let svgEl = $state();
  let wrapEl = $state();
  let width = $state(380);
  let height = $state(820);

  let hoveredBean = $state(null);
  let pinnedBean = $state(null);
  let activeBean = $derived(pinnedBean ?? hoveredBean);
  let activeFacts = $derived(activeBean ? beanFacts[activeBean] : null);
  // First-click hint fades out as soon as the reader engages with any bean.
  let hasInteracted = $state(false);

  // Touch devices fire a synthetic mouseover with their tap; gating hover to
  // hover-capable pointers keeps the model "click pins, hover browses" on
  // desktop while collapsing to "click pins" on touch.
  const hoverCapable =
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
      : true;

  function onBeanOver(e) {
    if (e.type === 'mouseover' && !hoverCapable) return;
    const el = e.target.closest && e.target.closest('[data-bean]');
    if (!el) return;
    hoveredBean = el.dataset.bean;
  }
  function onBeanOut(e) {
    if (e.type === 'mouseout' && !hoverCapable) return;
    const el = e.target.closest && e.target.closest('[data-bean]');
    if (!el) return;
    const to = e.relatedTarget;
    if (to && to.closest && to.closest('[data-bean]') === el) return;
    hoveredBean = null;
  }
  function onBeanClick(e) {
    const el = e.target.closest('[data-bean]');
    if (!el) return;
    const slug = el.dataset.bean;
    pinnedBean = pinnedBean === slug ? null : slug;
    hasInteracted = true;
  }
  function onBeanKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest && e.target.closest('[data-bean]');
    if (!el) return;
    e.preventDefault();
    const slug = el.dataset.bean;
    pinnedBean = pinnedBean === slug ? null : slug;
    hasInteracted = true;
  }
  function closeCard() {
    pinnedBean = null;
    hoveredBean = null;
  }

  onMount(() => {
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      width = r.width;
      draw();
    });
    ro.observe(wrapEl);
    draw();

    svgEl.addEventListener('mouseover', onBeanOver);
    svgEl.addEventListener('mouseout', onBeanOut);
    svgEl.addEventListener('focusin', onBeanOver);
    svgEl.addEventListener('focusout', onBeanOut);
    svgEl.addEventListener('click', onBeanClick);
    svgEl.addEventListener('keydown', onBeanKeydown);

    return () => {
      ro.disconnect();
      svgEl.removeEventListener('mouseover', onBeanOver);
      svgEl.removeEventListener('mouseout', onBeanOut);
      svgEl.removeEventListener('focusin', onBeanOver);
      svgEl.removeEventListener('focusout', onBeanOut);
      svgEl.removeEventListener('click', onBeanClick);
      svgEl.removeEventListener('keydown', onBeanKeydown);
    };
  });

  $effect(() => {
    width;
    draw();
  });

  function draw() {
    if (!svgEl) return;

    const data = Object.entries(beanFacts)
      .map(([slug, f]) => ({ slug, ...f }))
      .sort((a, b) => a.sizeMm - b.sizeMm);

    const margin = { top: 28, right: 12, bottom: 36, left: 56 };
    const tokens = chartTokens();

    // px-per-mm tuned so kidney bean (14 mm) reads as the dominant mark
    // in the chart. Below the floor the smallest beans would disappear,
    // so we clamp. Row height varies with the bean so smaller seeds
    // aren't swimming in whitespace.
    const pxPerMm = 8;
    const minImg = 22;
    const rowPad = 18;
    const sizePx = (mm) => Math.max(minImg, mm * pxPerMm);

    // Lay rows out top-to-bottom, accumulating y so each bean's row is
    // sized to its own image. We compute centerline + total height.
    let cursor = 0;
    const laid = data.map((d) => {
      const s = sizePx(d.sizeMm);
      const rowH = s + rowPad;
      const y = cursor + rowH / 2;
      cursor += rowH;
      return { ...d, sz: s, rowH, y };
    });

    const w = Math.max(0, width - margin.left - margin.right);
    const h = cursor;
    height = h + margin.top + margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr(
        'aria-label',
        'Bean size chart: thirteen common legumes ordered by seed diameter in millimetres.',
      );

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Column header — "mm" sits above the left gutter ----------------
    g.append('text')
      .attr('x', -10)
      .attr('y', -12)
      .attr('text-anchor', 'end')
      .attr('fill', tokens.axis)
      .style('font-family', 'var(--sans)')
      .style('font-size', '10px')
      .style('letter-spacing', '0.12em')
      .style('text-transform', 'uppercase')
      .text('mm');

    // Faint horizontal rules between rows ----------------------------
    g.append('g')
      .selectAll('line.divider')
      .data(laid.slice(1))
      .join('line')
      .attr('class', 'divider')
      .attr('x1', -48)
      .attr('x2', w)
      .attr('y1', (d) => d.y - d.rowH / 2)
      .attr('y2', (d) => d.y - d.rowH / 2)
      .attr('stroke', tokens.grid)
      .attr('opacity', 0.5);

    // Bean rows ------------------------------------------------------
    const row = g
      .selectAll('g.bean-row')
      .data(laid)
      .join('g')
      .attr('class', 'bean-row')
      .attr('data-bean', (d) => d.slug)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', (d) => `${d.name}, about ${d.sizeMm} mm: show details`)
      .attr('transform', (d) => `translate(0,${d.y})`);

    // Transparent hit-target spans the row for forgiving hover/tap
    row
      .append('rect')
      .attr('class', 'hit')
      .attr('x', -margin.left)
      .attr('y', (d) => -d.rowH / 2)
      .attr('width', width)
      .attr('height', (d) => d.rowH)
      .attr('fill', 'transparent');

    // mm value (right-aligned in the left gutter)
    row
      .append('text')
      .attr('x', -10)
      .attr('y', 0)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--text-on-light-muted)')
      .style('font-family', 'var(--sans)')
      .style('font-size', '12px')
      .text((d) => d.sizeMm);

    // Bean image, centered on the row baseline
    row
      .append('image')
      .attr('href', (d) => `/images/beans/${d.image}`)
      .attr('width', (d) => d.sz)
      .attr('height', (d) => d.sz)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('x', 0)
      .attr('y', (d) => -d.sz / 2)
      .attr('pointer-events', 'none');

    // Bean name
    row
      .append('text')
      .attr('class', 'name')
      .attr('x', (d) => d.sz + 14)
      .attr('y', 0)
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--text-on-light)')
      .style('font-family', 'var(--sans)')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .text((d) => d.name);
  }
</script>

<figure class="chart-block chart bean-sizes">
  <figcaption class="cap">
    <span class="subtitle">Common legumes, ordered smallest to largest</span>
    <span class="title">Size matters when it comes to digestion</span>
  </figcaption>

  <div class="bean-sizes__body">
    <div class="bean-sizes__chart" bind:this={wrapEl}>
      <p class="bean-sizes__hint" class:bean-sizes__hint--dim={hasInteracted}>
        Tap any bean for soaking and cook times
        <span class="bean-sizes__hint-arrow" aria-hidden="true">↓</span>
      </p>
      <svg bind:this={svgEl} class="bean-sizes__svg"></svg>
    </div>

    {#if activeFacts}
      <aside
        class="bean-card"
        class:bean-card--pinned={pinnedBean !== null}
        aria-label={`${activeFacts.name} — details`}
      >
        <button
          type="button"
          class="bean-card__close"
          aria-label="Close"
          onclick={closeCard}
        >×</button>
        <h3 class="bean-card__name">{activeFacts.name}</h3>
        <p class="bean-card__note">{activeFacts.note}</p>
        <dl class="bean-card__facts">
          <dt>Soak</dt>
          <dd>{activeFacts.soak}</dd>
          <dt>Cook time</dt>
          <dd>{activeFacts.cookTime}</dd>
          <dt>Cuisines</dt>
          <dd>{activeFacts.cuisines.join(', ')}</dd>
        </dl>
      </aside>
    {/if}
  </div>

  <p class="source">Source: own research.</p>
</figure>

<style>
  /* caption styles inherited from .chart .cap rules in app.css */

  .bean-sizes__body {
    display: block;
  }
  .bean-sizes__chart {
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
  }
  .bean-sizes__svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .bean-sizes__hint {
    font-family: var(--sans);
    font-size: 0.78rem;
    color: var(--text-on-light-muted);
    margin: 0 0 0.6rem;
    text-align: center;
    letter-spacing: 0.02em;
    transition: opacity 280ms ease-out;
  }
  .bean-sizes__hint--dim {
    opacity: 0;
  }
  .bean-sizes__hint-arrow {
    display: inline-block;
    margin-left: 0.25rem;
    color: var(--color-coral-lentil);
    animation: bean-sizes-hint-bob 1.6s ease-in-out infinite;
  }
  @keyframes bean-sizes-hint-bob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(3px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .bean-sizes__hint-arrow { animation: none; }
  }
  /* Each bean row acts as a button opening the card. */
  .bean-sizes__svg :global(.bean-row) {
    cursor: pointer;
    outline: none;
  }
  .bean-sizes__svg :global(.bean-row:hover .hit),
  .bean-sizes__svg :global(.bean-row:focus-visible .hit) {
    fill: var(--surface-linen);
  }
  .bean-sizes__svg :global(.bean-row:focus-visible .name) {
    fill: var(--color-coral-lentil);
  }

  /* ---- Bean fact card ----------------------------------------------------
     Desktop (≥800px): figure becomes a 2-column grid — svg + sticky card.
     Below that: card is a fixed bottom sheet so it never disturbs scroll
     position when it opens. */
  .bean-card {
    position: relative;
    background: var(--surface-cream);
    border: 1px solid var(--surface-stone);
    border-radius: 10px;
    padding: 1.25rem 1.25rem 1rem;
    font-family: var(--sans);
    color: var(--text-on-light);
    box-shadow: 0 2px 10px rgba(44, 26, 14, 0.06);
  }
  .bean-card__close {
    position: absolute;
    top: 0.45rem;
    right: 0.45rem;
    width: 1.9rem;
    height: 1.9rem;
    display: grid;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--text-on-light-muted);
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
    border-radius: 50%;
    transition: background 140ms ease-out, color 140ms ease-out;
  }
  .bean-card__close:hover,
  .bean-card__close:focus-visible {
    background: var(--surface-linen);
    color: var(--text-on-light);
    outline: none;
  }
  .bean-card__name {
    font-family: var(--sans);
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.25;
    margin: 0 2rem 0.4rem 0;
    color: var(--text-on-light);
  }
  .bean-card__note {
    font-family: var(--sans);
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--text-on-light);
    margin: 0 0 0.9rem;
  }
  .bean-card__facts {
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 0.85rem;
    row-gap: 0.3rem;
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.4;
  }
  .bean-card__facts dt {
    font-family: var(--sans);
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-on-light-muted);
    align-self: start;
    padding-top: 0.15rem;
  }
  .bean-card__facts dd {
    margin: 0;
    color: var(--text-on-light);
  }

  @media (min-width: 800px) {
    .bean-sizes__body {
      display: grid;
      grid-template-columns: minmax(0, 520px) minmax(220px, 280px);
      column-gap: 2rem;
      align-items: start;
      justify-content: center;
    }
    .bean-sizes__chart {
      margin: 0;
    }
    .bean-sizes .bean-card {
      position: sticky;
      top: 1.25rem;
      align-self: start;
      margin-top: 0.5rem;
    }
  }

  @media (max-width: 799px) {
    .bean-card {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0;
      border-radius: 14px 14px 0 0;
      border-bottom: 0;
      box-shadow: 0 -10px 28px rgba(44, 26, 14, 0.18);
      max-height: 55vh;
      overflow-y: auto;
      z-index: 60;
      padding-bottom: max(1rem, env(safe-area-inset-bottom));
      animation: bean-card-up 180ms ease-out;
    }
  }
  @keyframes bean-card-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .bean-card { animation: none; }
  }
</style>
