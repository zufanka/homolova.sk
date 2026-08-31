<!--
  Isometric "wall" area chart of Instagram's yearly revenue (2015–2026),
  after the classic isometric infographic style: a cyan extruded ribbon
  standing on a gray grid floor, blue end cap, ink outlines. Pink labels
  show Instagram's share of Meta's ad revenue for the years the source
  reports it. 2026 is a forecast (dashed top edge).

  Data: resourcera.com/data/social/instagram-revenue/
  (Meta doesn't break out Instagram revenue; figures are estimates.)
-->
<script>
  import { onMount } from 'svelte';

  const DATA = [
    { year: 2015, v: 0.5 },
    { year: 2016, v: 1.8 },
    { year: 2017, v: 4.1 },
    { year: 2018, v: 10.3 },
    { year: 2019, v: 16.2 },
    { year: 2020, v: 21.8 },
    { year: 2021, v: 32 },
    { year: 2022, v: 36.9, share: 44 },
    { year: 2023, v: 49.8, share: 46 },
    { year: 2024, v: 66.9, share: 48 },
    { year: 2025, v: 83.6, share: 50 },
    { year: 2026, v: 85, share: 53, forecast: true },
  ];

  const N = DATA.length;
  const THICK = 0.7; // ribbon thickness, raw units
  const ZMAX = 4.6; // raw height of the largest value
  const VMAX = Math.max(...DATA.map((d) => d.v));
  const GX = [-1.4, 2.6]; // grid floor extent (x)
  const GY = [-(N - 1) - 1.8, 1.8]; // grid floor extent (y)

  const INK = '#020202';
  const FACE = '#45d8e4';
  const RIM = '#b8eef4';
  const CAP = '#5b8bee';
  const SHARE = '#e0217a';
  const GRID = '#c8c8d0';
  const GRID_EDGE = '#aeaeba';

  let wrapEl = $state();
  let svgEl = $state();
  let width = $state(800);
  let height = $state(500);

  const z = (v) => (v / VMAX) * ZMAX;
  const fmt = (v) => v.toFixed(1).replace(/\.0$/, '');

  onMount(() => {
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      width = r.width;
      height = Math.max(340, Math.min(500, r.width * 0.62));
    });
    ro.observe(wrapEl);
    return () => ro.disconnect();
  });

  $effect(() => {
    width;
    height;
    draw();
  });

  function draw() {
    if (!svgEl) return;

    const margin = { top: 56, right: 14, bottom: 38, left: 14 };
    const raw = (x, y, zz) => [x - y, (x + y) * 0.5 - zz];

    // fit raw isometric space into the available box
    const corners = [
      raw(GX[0], GY[0], 0),
      raw(GX[0], GY[1], 0),
      raw(GX[1], GY[0], 0),
      raw(GX[1], GY[1], 0),
      ...DATA.flatMap((d, i) => [raw(THICK, -i, z(d.v)), raw(0, -i, z(d.v))]),
    ];
    const xs = corners.map((p) => p[0]);
    const ys = corners.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const availW = width - margin.left - margin.right;
    const availH = height - margin.top - margin.bottom;
    const k = Math.min(availW / (maxX - minX), availH / (maxY - minY));
    const ox = margin.left + (availW - k * (maxX - minX)) / 2 - k * minX;
    const oy = margin.top + (availH - k * (maxY - minY)) - k * minY; // bottom-aligned
    const P = (x, y, zz) => {
      const [rx, ry] = raw(x, y, zz);
      return [ox + k * rx, oy + k * ry];
    };

    const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    const poly = (pts) => pts.map(pt).join(' ');
    const narrow = k * 1.12 < 29; // year-to-year screen distance

    // ribbon geometry: years run front-left -> back-right along -y
    const top = DATA.map((d, i) => P(THICK, -i, z(d.v))); // front top edge
    const topBack = DATA.map((d, i) => P(0, -i, z(d.v))); // back top edge
    const base0 = P(THICK, 0, 0);
    const baseN = P(THICK, -(N - 1), 0);

    let s = '';

    // grid floor
    let grid = '';
    for (let gx = Math.ceil(GX[0]); gx <= Math.floor(GX[1]); gx++)
      grid += `M${pt(P(gx, GY[0], 0))}L${pt(P(gx, GY[1], 0))}`;
    for (let gy = Math.ceil(GY[0]); gy <= Math.floor(GY[1]); gy++)
      grid += `M${pt(P(GX[0], gy, 0))}L${pt(P(GX[1], gy, 0))}`;
    s += `<path d="${grid}" fill="none" stroke="${GRID}" stroke-width="1"/>`;
    s += `<polygon points="${poly([
      P(GX[0], GY[0], 0), P(GX[1], GY[0], 0), P(GX[1], GY[1], 0), P(GX[0], GY[1], 0),
    ])}" fill="none" stroke="${GRID_EDGE}" stroke-width="1"/>`;

    // ribbon: top rim, front end cap, front face
    s += `<polygon points="${poly([...top, ...[...topBack].reverse()])}"
      fill="${RIM}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
    s += `<polygon points="${poly([top[0], topBack[0], P(0, 0, 0), base0])}"
      fill="${CAP}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
    s += `<polygon points="${poly([...top, baseN, base0])}"
      fill="${FACE}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;

    // top edge: solid until 2025, dashed to the 2026 forecast
    s += `<polyline points="${poly(top.slice(0, N - 1))}" fill="none"
      stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    s += `<line x1="${top[N - 2][0]}" y1="${top[N - 2][1]}" x2="${top[N - 1][0]}" y2="${top[N - 1][1]}"
      stroke="${INK}" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>`;

    // value labels (first one nudged up so it clears the blue end cap)
    DATA.forEach((d, i) => {
      const [x, y] = top[i];
      const label = fmt(d.v) + (d.forecast ? '*' : '');
      if (narrow) {
        const dy = i === 0 ? -13 : -7;
        s += `<text transform="translate(${(x - 2).toFixed(1)},${(y + dy).toFixed(1)}) rotate(-42)"
          text-anchor="end" style="font-family:var(--sans);font-size:10px;font-weight:600" fill="${INK}">${label}</text>`;
      } else {
        s += `<text x="${x.toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle"
          style="font-family:var(--sans);font-size:11px;font-weight:600" fill="${INK}">${label}</text>`;
      }
    });

    // pink marker + annotation on the 2025 peak backing the headline claim
    const [ax, ay] = top[N - 2]; // 2025
    const noteX = narrow ? ax - 8 : ax - 18;
    const noteY = narrow ? ay - 26 : ay - 8;
    s += `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="4.5" fill="${SHARE}" stroke="${INK}" stroke-width="1.5"/>`;
    s += `<text x="${noteX.toFixed(1)}" y="${noteY.toFixed(1)}" text-anchor="end"
      style="font-family:var(--sans);font-size:12px;font-weight:700" fill="${SHARE}">≈50% of Meta's ad revenue in 2025</text>`;

    // year labels on the floor, in front of the wall base
    DATA.forEach((d, i) => {
      if (narrow && i % 2 !== 0 && i !== N - 1) return;
      if (narrow && i === N - 2) return; // avoid colliding with the final year
      const [x, y] = P(THICK + 0.55, -i, 0);
      s += `<text x="${x.toFixed(1)}" y="${(y + 13).toFixed(1)}" text-anchor="middle"
        style="font-family:var(--sans);font-size:${narrow ? 9 : 10.5}px" fill="#5a5a66">${d.year}</text>`;
    });

    // legend
    s += `<g style="font-family:var(--sans);font-size:11px" fill="#444">
      <rect x="26" y="20" width="12" height="9" fill="${FACE}" stroke="${INK}" stroke-width="1.2"/>
      <text x="44" y="28" stroke="#eff0f2" stroke-width="3" paint-order="stroke">Instagram revenue, USD bn (2026: forecast)</text>
      <rect x="26" y="38" width="12" height="9" fill="${SHARE}" stroke="${INK}" stroke-width="1.2"/>
      <text x="44" y="46" stroke="#eff0f2" stroke-width="3" paint-order="stroke">Share of Meta's ad revenue</text>
    </g>`;

    svgEl.innerHTML = s;
  }
</script>

<figure class="iso-fig" bind:this={wrapEl}>
  <figcaption>
    <span class="fig-title">Instagram is now responsible for about half of Meta's yearly revenue</span>
    <span class="fig-sub">Yearly Instagram revenue in billion USD</span>
  </figcaption>
  <div class="panel">
    <svg
      bind:this={svgEl}
      viewBox="0 0 {width} {height}"
      role="img"
      aria-label="Isometric area chart: Instagram revenue grew from 0.5 billion USD in 2015 to an estimated 83.6 billion in 2025, about half of Meta's ad revenue."
    ></svg>
  </div>
  <p class="src">
    Source: <a href="https://resourcera.com/data/social/instagram-revenue/" target="_blank" rel="noopener">Resourcera</a>
    — estimates; Meta does not break out Instagram revenue in its reports. *2026 figures are forecasts.
  </p>
  <table class="vh">
    <caption>Instagram yearly revenue, billion USD</caption>
    <thead><tr><th>Year</th><th>Revenue (USD bn)</th><th>Share of Meta ad revenue</th></tr></thead>
    <tbody>
      {#each DATA as d}
        <tr><td>{d.year}{d.forecast ? ' (forecast)' : ''}</td><td>{fmt(d.v)}</td><td>{d.share ? d.share + '%' : '—'}</td></tr>
      {/each}
    </tbody>
  </table>
</figure>

<style>
  .iso-fig {
    margin: 2.5rem 0;
  }
  figcaption {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .fig-title {
    font-family: var(--display);
    font-size: 1.15rem;
    line-height: 1.25;
    color: var(--ink);
  }
  .fig-sub {
    font-family: var(--sans);
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #3f6fd8;
  }
  .panel {
    margin-top: 1rem;
    background: #eff0f2;
    border: var(--border);
    box-shadow: 4px 4px 0 var(--ink);
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .src {
    font-family: var(--sans);
    font-size: 0.78rem;
    color: var(--muted);
    margin: 0.75rem 0 0;
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
