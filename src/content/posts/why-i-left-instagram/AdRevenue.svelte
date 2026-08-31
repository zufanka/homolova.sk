<!--
  Isometric bar chart of 2025 ad revenue for the big algorithmic feed
  platforms: Meta ($196B), YouTube ($40.4B), TikTok ($33.1B, forecast).
  Three extruded bars in a monochrome pink ramp on a gray grid floor,
  with the platform logos lying flat on the top faces (skewed with an
  isometric matrix), value + name labels stacked above.

  Sources: Statista (Meta), Tubefilter / Alphabet Q4 2025 (YouTube),
  MarketingLTB (TikTok, forecast).
-->
<script>
  import { onMount } from 'svelte';
  import metaLogo from './media/logo-meta.svg';
  import youtubeLogo from './media/logo-youtube.svg';
  import tiktokLogo from './media/logo-tiktok.svg';

  // drawn back -> front so front bars occlude the bases of taller back bars
  const BARS = [
    {
      name: 'Meta', v: 196, y0: -4.4, logo: metaLogo,
      c: { top: '#f273ab', front: '#d63384', right: '#ad2a6c' },
    },
    {
      name: 'YouTube', v: 40.4, y0: -2.2, logo: youtubeLogo,
      c: { top: '#ff9cc2', front: '#ef5ba1', right: '#cb3f83' },
    },
    {
      name: 'TikTok', v: 33.1, y0: 0, logo: tiktokLogo, forecast: true,
      c: { top: '#ffc4d9', front: '#ff8bb8', right: '#e57aa5' },
    },
  ];

  const W = 1.5; // bar width/depth, raw units
  const ZMAX = 4.6; // raw height of the largest value
  const VMAX = 196;
  const GX = [-0.8, 2.3]; // grid floor extent (x)
  const GY = [-5.6, 1.2]; // grid floor extent (y)
  const LOGO_L = 1.0; // logo span across the top face, raw units

  const INK = '#020202';
  const GRID = '#c8c8d0';
  const GRID_EDGE = '#aeaeba';

  let wrapEl = $state();
  let svgEl = $state();
  let width = $state(800);
  let height = $state(560);

  const z = (v) => (v / VMAX) * ZMAX;
  const fmt = (v) => `$${v >= 100 ? Math.round(v) : v.toFixed(1)}B`;

  onMount(() => {
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      width = r.width;
      height = Math.max(380, Math.min(560, r.width * 0.72));
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

    const margin = { top: 96, right: 14, bottom: 40, left: 14 };
    const raw = (x, y, zz) => [x - y, (x + y) * 0.5 - zz];

    const corners = [
      raw(GX[0], GY[0], 0),
      raw(GX[0], GY[1], 0),
      raw(GX[1], GY[0], 0),
      raw(GX[1], GY[1], 0),
      ...BARS.flatMap((b) => [
        raw(0, b.y0, z(b.v)), raw(W, b.y0, z(b.v)),
        raw(0, b.y0 + W, z(b.v)), raw(W, b.y0 + W, z(b.v)),
      ]),
    ];
    const xs = corners.map((p) => p[0]);
    const ys = corners.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const availW = width - margin.left - margin.right;
    const availH = height - margin.top - margin.bottom;
    const k = Math.min(availW / (maxX - minX), availH / (maxY - minY));
    const ox = margin.left + (availW - k * (maxX - minX)) / 2 - k * minX;
    const oy = margin.top + (availH - k * (maxY - minY)) - k * minY;
    const P = (x, y, zz) => {
      const [rx, ry] = raw(x, y, zz);
      return [ox + k * rx, oy + k * ry];
    };

    const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    const poly = (pts) => pts.map(pt).join(' ');

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

    // bars
    for (const b of BARS) {
      const zz = z(b.v);
      const { y0 } = b;
      const front = [P(0, y0 + W, 0), P(W, y0 + W, 0), P(W, y0 + W, zz), P(0, y0 + W, zz)];
      const right = [P(W, y0, 0), P(W, y0 + W, 0), P(W, y0 + W, zz), P(W, y0, zz)];
      const top = [P(0, y0, zz), P(W, y0, zz), P(W, y0 + W, zz), P(0, y0 + W, zz)];
      const face = (pts, fill) =>
        `<polygon points="${poly(pts)}" fill="${fill}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
      s += face(right, b.c.right) + face(front, b.c.front) + face(top, b.c.top);

      // logo lying flat on the top face, skewed by the isometric matrix
      const [cx, cy] = P(W / 2, y0 + W / 2, zz);
      const q = (k * LOGO_L) / 24;
      s += `<g transform="matrix(${q.toFixed(3)} ${(0.5 * q).toFixed(3)} ${(-q).toFixed(3)} ${(0.5 * q).toFixed(3)} ${cx.toFixed(1)} ${cy.toFixed(1)})">
        <image href="${b.logo}" x="-12" y="-12" width="24" height="24"/>
      </g>`;

      // name + value stacked above the logo, nudged left so they don't
      // cross the face of the taller bar behind
      const lx = cx - 0.8 * k;
      const logoTop = cy - 0.5 * k * LOGO_L;
      const name = b.name + (b.forecast ? '*' : '');
      s += `<text x="${lx.toFixed(1)}" y="${(logoTop - 44).toFixed(1)}" text-anchor="middle"
        style="font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase" fill="${INK}">${name}</text>`;
      s += `<text x="${lx.toFixed(1)}" y="${(logoTop - 16).toFixed(1)}" text-anchor="middle"
        style="font-family:var(--display);font-size:21px" fill="${INK}">${fmt(b.v)}</text>`;
    }

    svgEl.innerHTML = s;
  }
</script>

<figure class="iso-fig" bind:this={wrapEl}>
  <figcaption>
    <span class="fig-title">Meta sells the most ads among the big algorithmic feed platforms</span>
    <span class="fig-sub">Ad revenue 2025, in billion USD</span>
  </figcaption>
  <div class="panel">
    <svg
      bind:this={svgEl}
      viewBox="0 0 {width} {height}"
      role="img"
      aria-label="Isometric bar chart: Meta's 2025 ad revenue of 196 billion USD dwarfs YouTube's 40.4 billion and TikTok's forecast 33.1 billion."
    ></svg>
  </div>
  <p class="src">
    Sources:
    <a href="https://www.statista.com/statistics/271258/facebooks-advertising-revenue-worldwide/" target="_blank" rel="noopener">Statista</a> (Meta),
    <a href="https://www.tubefilter.com/2026/02/05/alphabet-q4-2025-youtube-earnings-revenue-60-billion/" target="_blank" rel="noopener">Tubefilter / Alphabet Q4 2025</a> (YouTube),
    <a href="https://marketingltb.com/blog/statistics/tiktok-ads-statistics/#2" target="_blank" rel="noopener">MarketingLTB</a> (*TikTok — forecast).
  </p>
  <table class="vh">
    <caption>Ad revenue 2025, billion USD</caption>
    <thead><tr><th>Platform</th><th>Ad revenue (USD bn)</th></tr></thead>
    <tbody>
      {#each BARS as b}
        <tr><td>{b.name}{b.forecast ? ' (forecast)' : ''}</td><td>{b.v}</td></tr>
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
    color: #c73a82;
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
