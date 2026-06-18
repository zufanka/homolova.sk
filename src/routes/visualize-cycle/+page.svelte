<script lang="ts">
  import innerAutumnThumb from '../../content/posts/the-inner-autumn/media/uterusinautumn.jpg';

  const DAY = 86400000;

  /* ---------- date parsing (YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY) ---------- */
  function parseDate(s: string): Date | null {
    s = s.trim();
    if (!s) return null;
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)))
      return new Date(+m[1], +m[2] - 1, +m[3]);
    if ((m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)))
      return new Date(+m[3], +m[2] - 1, +m[1]);
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  /* ---------- stats helpers ---------- */
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  function median(a: number[]) {
    const b = [...a].sort((x, y) => x - y);
    const n = b.length;
    return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
  }
  const stdev = (a: number[]) => {
    const m = mean(a);
    return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
  };
  // length -> color: green (short) through yellow to red (long)
  function colorFor(len: number) {
    const t = Math.max(0, Math.min(1, (len - 25) / (65 - 25)));
    return `hsl(${120 * (1 - t)},70%,45%)`;
  }
  const num = (x: number) => (Number.isInteger(x) ? x.toString() : x.toFixed(1));

  /* ---------- declarative SVG primitives ---------- */
  type Rect = { x: number; y: number; w: number; h: number; fill: string; opacity?: number };
  type Line = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke: string;
    width?: number;
    dash?: string;
    opacity?: number;
  };
  type Txt = {
    x: number;
    y: number;
    anchor: 'start' | 'middle' | 'end';
    size: number;
    fill: string;
    weight?: number;
    transform?: string;
    text: string;
  };
  type Dot = { cx: number; cy: number; r: number; fill: string; title: string };
  type Chart = {
    viewBox: string;
    rects: Rect[];
    lines: Line[];
    texts: Txt[];
    polyline: string;
    dots: Dot[];
  };

  function buildHorizontal(starts: Date[], gaps: number[], mu: number, md: number): Chart {
    const W = 820,
      H = 460,
      m = { t: 18, r: 18, b: 46, l: 44 };
    const FS = { ax: 11, lab: 11, mm: 11 };
    const R = 5.5;
    const iw = W - m.l - m.r,
      ih = H - m.t - m.b;
    const t0 = starts[0].getTime(),
      t1 = starts[starts.length - 1].getTime();
    const span = Math.max(1, t1 - t0);
    const yMax = Math.max(75, Math.max(...gaps) + 5),
      yMin = 20;
    const X = (t: number) => m.l + ((t - t0) / span) * iw;
    const Y = (v: number) => m.t + (1 - (v - yMin) / (yMax - yMin)) * ih;

    const rects: Rect[] = [];
    const lines: Line[] = [];
    const texts: Txt[] = [];
    const dots: Dot[] = [];

    // normal-range band 24–35
    rects.push({ x: m.l, y: Y(35), w: iw, h: Y(24) - Y(35), fill: '#2e7d32', opacity: 0.08 });
    lines.push({ x1: m.l, y1: Y(35), x2: m.l + iw, y2: Y(35), stroke: '#2e7d32', dash: '2 3', opacity: 0.5 });

    // y grid + labels
    for (let v = 20; v <= yMax; v += 10) {
      lines.push({ x1: m.l, y1: Y(v), x2: m.l + iw, y2: Y(v), stroke: '#000', opacity: 0.06 });
      texts.push({ x: m.l - 6, y: Y(v) + 4, anchor: 'end', size: FS.ax, fill: '#777', text: String(v) });
    }
    texts.push({
      x: 14,
      y: m.t + ih / 2,
      anchor: 'middle',
      size: FS.lab,
      fill: '#777',
      transform: `rotate(-90 14 ${m.t + ih / 2})`,
      text: 'cycle length (days)'
    });

    // x ticks: years for long ranges, else months (thinned so labels never collide)
    const yearMode = span > 540 * DAY;
    const d0 = new Date(t0),
      d1 = new Date(t1);
    if (yearMode) {
      const years: number[] = [];
      for (let y = d0.getFullYear(); y <= d1.getFullYear() + 1; y++) years.push(y);
      const stride = Math.ceil(years.length / 8);
      years.forEach((y, i) => {
        const tx = new Date(y, 0, 1).getTime();
        if (tx < t0 || tx > t1) return;
        lines.push({ x1: X(tx), y1: m.t, x2: X(tx), y2: m.t + ih, stroke: '#000', opacity: 0.05 });
        if (i % stride === 0)
          texts.push({ x: X(tx), y: H - m.b + 22, anchor: 'middle', size: FS.ax, fill: '#777', text: String(y) });
      });
    } else {
      const months: Date[] = [];
      let c = new Date(d0.getFullYear(), d0.getMonth(), 1);
      while (c.getTime() <= t1) {
        months.push(new Date(c));
        c.setMonth(c.getMonth() + 1);
      }
      const stride = Math.ceil(months.length / 8);
      months.forEach((mo, i) => {
        const tx = mo.getTime();
        if (tx < t0) return;
        lines.push({ x1: X(tx), y1: m.t, x2: X(tx), y2: m.t + ih, stroke: '#000', opacity: 0.05 });
        if (i % stride === 0)
          texts.push({
            x: X(tx),
            y: H - m.b + 22,
            anchor: 'middle',
            size: FS.ax,
            fill: '#777',
            text: mo.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
          });
      });
    }

    // mean & median lines
    lines.push({ x1: m.l, y1: Y(mu), x2: m.l + iw, y2: Y(mu), stroke: '#5b8bee', width: 1.6, dash: '6 4' });
    texts.push({ x: m.l + iw - 4, y: Y(mu) - 5, anchor: 'end', size: FS.mm, fill: '#3a6bd0', weight: 600, text: `mean ${mu.toFixed(0)}` });
    lines.push({ x1: m.l, y1: Y(md), x2: m.l + iw, y2: Y(md), stroke: '#020202', width: 1.1, dash: '2 3' });
    texts.push({ x: m.l + iw - 4, y: Y(md) + FS.mm + 3, anchor: 'end', size: FS.mm, fill: '#020202', weight: 600, text: `median ${md.toFixed(0)}` });

    const polyline = starts.map((d, i) => `${X(d.getTime())},${Y(gaps[i])}`).join(' ');
    starts.forEach((d, i) => {
      dots.push({ cx: X(d.getTime()), cy: Y(gaps[i]), r: R, fill: colorFor(gaps[i]), title: `${fmt(d)} → ${gaps[i]} days` });
    });

    return { viewBox: `0 0 ${W} ${H}`, rects, lines, texts, polyline, dots };
  }

  function buildVertical(starts: Date[], gaps: number[], mu: number, md: number): Chart {
    const W = 380,
      H = 680,
      m = { t: 74, r: 16, b: 14, l: 48 };
    const FS = { ax: 14, mm: 14 };
    const R = 6;
    const iw = W - m.l - m.r,
      ih = H - m.t - m.b;
    const t0 = starts[0].getTime(),
      t1 = starts[starts.length - 1].getTime();
    const span = Math.max(1, t1 - t0);
    const lMax = Math.max(75, Math.max(...gaps) + 5),
      lMin = 20;
    const X = (v: number) => m.l + ((v - lMin) / (lMax - lMin)) * iw; // length -> x
    const Y = (t: number) => m.t + ((t - t0) / span) * ih; // time -> y (earliest at top)

    const rects: Rect[] = [];
    const lines: Line[] = [];
    const texts: Txt[] = [];
    const dots: Dot[] = [];

    // normal-range band 24–35 (vertical strip)
    rects.push({ x: X(24), y: m.t, w: X(35) - X(24), h: ih, fill: '#2e7d32', opacity: 0.08 });
    lines.push({ x1: X(35), y1: m.t, x2: X(35), y2: m.t + ih, stroke: '#2e7d32', dash: '2 3', opacity: 0.5 });

    // length grid + labels along the top
    for (let v = 20; v <= lMax; v += 10) {
      lines.push({ x1: X(v), y1: m.t, x2: X(v), y2: m.t + ih, stroke: '#000', opacity: 0.06 });
      texts.push({ x: X(v), y: m.t - 40, anchor: 'middle', size: FS.ax, fill: '#777', text: String(v) });
    }
    texts.push({ x: m.l + iw, y: m.t - 56, anchor: 'end', size: FS.ax, fill: '#777', text: 'cycle length (days)' });

    // time ticks down the left, thinned to avoid collisions
    const yearMode = span > 540 * DAY;
    const d0 = new Date(t0),
      d1 = new Date(t1);
    const ticks: [number, string][] = [];
    if (yearMode) {
      for (let y = d0.getFullYear(); y <= d1.getFullYear() + 1; y++) {
        const tx = new Date(y, 0, 1).getTime();
        if (tx >= t0 && tx <= t1) ticks.push([tx, String(y)]);
      }
    } else {
      let c = new Date(d0.getFullYear(), d0.getMonth(), 1);
      while (c.getTime() <= t1) {
        if (c.getTime() >= t0)
          ticks.push([c.getTime(), c.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })]);
        c.setMonth(c.getMonth() + 1);
      }
    }
    const stride = Math.ceil(ticks.length / 8);
    ticks.forEach(([tx, lab], i) => {
      lines.push({ x1: m.l, y1: Y(tx), x2: m.l + iw, y2: Y(tx), stroke: '#000', opacity: 0.05 });
      if (i % stride === 0)
        texts.push({ x: m.l - 8, y: Y(tx) + 4, anchor: 'end', size: FS.ax, fill: '#777', text: lab });
    });

    // mean & median (vertical lines; horizontal labels flanking them so they never collide)
    lines.push({ x1: X(md), y1: m.t, x2: X(md), y2: m.t + ih, stroke: '#020202', width: 1.1, dash: '2 3' });
    texts.push({ x: X(md) - 5, y: m.t - 12, anchor: 'end', size: FS.mm, fill: '#020202', weight: 600, text: `median ${md.toFixed(0)}` });
    lines.push({ x1: X(mu), y1: m.t, x2: X(mu), y2: m.t + ih, stroke: '#5b8bee', width: 1.6, dash: '6 4' });
    texts.push({ x: X(mu) + 5, y: m.t - 12, anchor: 'start', size: FS.mm, fill: '#3a6bd0', weight: 600, text: `mean ${mu.toFixed(0)}` });

    const polyline = starts.map((d, i) => `${X(gaps[i])},${Y(d.getTime())}`).join(' ');
    starts.forEach((d, i) => {
      dots.push({ cx: X(gaps[i]), cy: Y(d.getTime()), r: R, fill: colorFor(gaps[i]), title: `${fmt(d)} → ${gaps[i]} days` });
    });

    return { viewBox: `0 0 ${W} ${H}`, rects, lines, texts, polyline, dots };
  }

  /* ---------- reactive state ---------- */
  let datesText = $state('');
  let picker = $state('');
  let winW = $state(900); // desktop default for prerender; updated on mount
  let svgEl = $state<SVGSVGElement | null>(null);

  const dates = $derived(
    datesText
      .split(/\n+/)
      .map(parseDate)
      .filter((d): d is Date => Boolean(d))
      .sort((a, b) => a.getTime() - b.getTime())
      // de-duplicate identical days
      .filter((d, i, arr) => i === 0 || d.getTime() - arr[i - 1].getTime() !== 0)
  );

  const model = $derived.by(() => {
    if (dates.length < 3) return null;
    const gaps: number[] = [];
    const starts: Date[] = [];
    for (let i = 0; i < dates.length - 1; i++) {
      gaps.push(Math.round((dates[i + 1].getTime() - dates[i].getTime()) / DAY));
      starts.push(dates[i]);
    }
    return {
      gaps,
      starts,
      mu: mean(gaps),
      md: median(gaps),
      sd: stdev(gaps),
      mn: Math.min(...gaps),
      mx: Math.max(...gaps)
    };
  });

  const chart = $derived.by(() => {
    if (!model) return null;
    const builder = winW < 560 ? buildVertical : buildHorizontal;
    return builder(model.starts, model.gaps, model.mu, model.md);
  });

  const insight = $derived.by(() => {
    if (!model) return '';
    const { mu, md, sd } = model;
    const msg: string[] = [];
    if (mu > 35) msg.push(`Your average cycle (${mu.toFixed(0)} d) runs longer than the typical 24–35 day range.`);
    else if (mu < 24) msg.push(`Your average cycle (${mu.toFixed(0)} d) runs shorter than the typical range.`);
    else msg.push(`Your average cycle (${mu.toFixed(0)} d) sits within the typical 24–35 day range.`);
    if (sd > 9) msg.push(`The spread is wide (±${sd.toFixed(0)} d) — your cycles are fairly irregular.`);
    else if (sd < 4) msg.push(`The spread is small (±${sd.toFixed(0)} d) — your cycles are quite regular.`);
    if (mu - md > 3) msg.push(`A few long cycles pull the average above the median.`);
    return msg.join(' ');
  });

  /* ---------- actions ---------- */
  function addPicked() {
    if (!picker) return;
    datesText = (datesText.trim() ? datesText.trim() + '\n' : '') + picker;
    picker = '';
  }

  function loadExample() {
    // builds example dates from the 42-cycle dataset starting 24 Jul 2021
    const gaps = [
      38, 39, 28, 55, 55, 37, 50, 35, 50, 55, 51, 37, 35, 45, 40, 39, 34, 57, 48, 46, 26, 34, 71, 43,
      38, 30, 32, 45, 29, 64, 66, 51, 29, 46, 43, 35, 34, 60, 29, 35, 29, 44
    ];
    const pad = (n: number) => String(n).padStart(2, '0');
    const iso = (x: Date) => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
    let d = new Date(2021, 6, 24);
    const out = [iso(d)];
    // add calendar days (DST-safe) rather than raw milliseconds
    gaps.forEach((g) => {
      d = new Date(d);
      d.setDate(d.getDate() + g);
      out.push(iso(d));
    });
    datesText = out.join('\n');
  }

  function exportPNG() {
    if (!svgEl) return;
    const vb = svgEl.viewBox.baseVal,
      w = vb.width,
      h = vb.height,
      scale = 2;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));
    const xml = new XMLSerializer().serializeToString(clone);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w * scale;
      c.height = h * scale;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.download = 'between-the-cycles.png';
        a.href = URL.createObjectURL(blob);
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      }, 'image/png');
    };
    img.src = url;
  }
</script>

<svelte:window bind:innerWidth={winW} />

<div class="wrap">
  <header class="page-head">
    <h1>Between the Cycles</h1>
    <p>Enter the start date of each period — see what your cycle really looks like.</p>
  </header>

  <div class="grid">
    <!-- INPUT -->
    <div class="card">
      <label for="dates">Cycle start dates</label>
      <textarea
        id="dates"
        bind:value={datesText}
        placeholder={`One date per line, e.g.\n2024-01-10\n2024-02-13\n2024-04-24\n\nAlso accepts 13.02.2024 or 13/02/2024`}
      ></textarea>
      <div class="row">
        <input type="date" bind:value={picker} aria-label="Pick a date to add" />
        <button class="btn-ghost" onclick={addPicked}>+ Add</button>
      </div>
      <div class="row">
        <button class="btn-ghost" onclick={loadExample}>Example</button>
        <button class="btn-ghost" onclick={() => (datesText = '')}>Clear</button>
      </div>
      <p class="hint">Your data never leaves this page — nothing is uploaded or saved anywhere.</p>
    </div>

    <!-- OUTPUT -->
    <div class="card">
      {#if model}
        <div class="stats">
          <div class="stat"><b>{model.gaps.length}</b><span>cycles</span></div>
          <div class="stat"><b>{num(model.md)}</b><span>median days</span></div>
          <div class="stat"><b>{num(model.mu)}</b><span>mean days</span></div>
          <div class="stat"><b>±{model.sd.toFixed(0)}</b><span>std dev</span></div>
          <div class="stat"><b>{model.mn}</b><span>shortest</span></div>
          <div class="stat"><b>{model.mx}</b><span>longest</span></div>
        </div>
      {/if}

      {#if chart}
        <svg
          bind:this={svgEl}
          viewBox={chart.viewBox}
          role="img"
          aria-label="Cycle length over time"
        >
          {#each chart.rects as r}
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} opacity={r.opacity ?? 1} rx="0" />
          {/each}
          {#each chart.lines as l}
            <line
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={l.stroke}
              stroke-width={l.width ?? 1}
              stroke-dasharray={l.dash ?? 'none'}
              opacity={l.opacity ?? 1}
            />
          {/each}
          {#if chart.polyline}
            <polyline points={chart.polyline} fill="none" stroke="#555" stroke-width="1.2" opacity="0.55" />
          {/if}
          {#each chart.dots as dot}
            <circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.fill} stroke="#222" stroke-width="0.6">
              <title>{dot.title}</title>
            </circle>
          {/each}
          {#each chart.texts as t}
            <text
              x={t.x}
              y={t.y}
              text-anchor={t.anchor}
              font-size={t.size}
              fill={t.fill}
              font-weight={t.weight ?? 400}
              transform={t.transform ?? ''}>{t.text}</text
            >
          {/each}
        </svg>
      {:else}
        <div class="empty">Add at least 3 dates to see your chart.</div>
      {/if}

      {#if insight}
        <div class="insight">{insight}</div>
      {/if}

      {#if chart}
        <div class="toolbar">
          <button class="btn-ghost" onclick={exportPNG}>⬇&nbsp; Save chart as PNG</button>
        </div>
      {/if}
    </div>
  </div>

  <!-- ESSAY CARD -->
  <a class="essay" href="/posts/the-inner-autumn">
    <img class="essay-thumb" src={innerAutumnThumb} alt="The Inner Autumn" />
    <div class="essay-body">
      <span class="essay-kicker">From the author</span>
      <h3>The Inner Autumn</h3>
      <p>How I learned to stop worrying and love the PMS&nbsp;<span class="arrow">→</span></p>
    </div>
  </a>

  <p class="disclaimer">
    Cycle length is the number of days from one period start to the next. A common reference range is
    about 24–35 days, but normal varies a lot between people. This tool is for personal insight and
    education only — it is not medical advice. Persistent irregularity is worth a chat with a doctor.
  </p>
</div>

<style>
  .wrap {
    max-width: 880px;
    margin: 0 auto;
    padding: 30px 0 60px;
  }
  .page-head h1 {
    font-family: var(--display);
    color: var(--blue);
    text-transform: uppercase;
    font-size: clamp(1.9rem, 8.5vw, 2.6rem);
    line-height: 0.95;
    margin: 0 0 10px;
    letter-spacing: 0.5px;
    -webkit-text-stroke: 0.5px var(--ink);
    paint-order: stroke fill;
  }
  .page-head p {
    margin: 0 0 24px;
    color: var(--ink);
    font-size: 1.05rem;
    font-weight: 500;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
  }
  @media (min-width: 720px) {
    .grid {
      grid-template-columns: 300px 1fr;
    }
  }
  .card {
    background: var(--card);
    border: var(--border);
    border-radius: 14px;
    padding: 16px 16px 18px;
    box-shadow: 4px 4px 0 var(--ink);
  }
  label {
    font-family: var(--slab);
    font-weight: 700;
    font-size: 0.95rem;
    display: block;
    margin-bottom: 6px;
    color: var(--ink);
  }
  textarea {
    width: 100%;
    min-height: 200px;
    resize: vertical;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 0.9rem;
    border: var(--border);
    border-radius: 10px;
    padding: 10px;
    background: #fff;
    color: var(--ink);
  }
  .row {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  input[type='date'] {
    flex: 1;
    padding: 9px;
    border: var(--border);
    border-radius: 10px;
    font-size: 0.9rem;
    min-width: 140px;
    background: #fff;
  }
  button {
    cursor: pointer;
    border: var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.9rem;
    font-weight: 600;
    font-family: var(--sans);
    transition:
      transform 0.05s,
      box-shadow 0.05s;
  }
  button:active {
    transform: translate(2px, 2px);
  }
  .btn-ghost {
    background: #fff;
    color: var(--ink);
    box-shadow: 3px 3px 0 var(--ink);
  }
  .btn-ghost:hover {
    background: #f3eee8;
  }
  .btn-ghost:active {
    box-shadow: 1px 1px 0 var(--ink);
  }
  .row .btn-ghost {
    flex: 1;
  }
  .hint {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 10px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
  .stat {
    background: #fff;
    border: var(--border);
    border-radius: 10px;
    padding: 10px 8px;
    text-align: center;
  }
  .stat b {
    display: block;
    font-family: var(--slab);
    font-weight: 700;
    font-size: 1.5rem;
    line-height: 1.1;
    color: var(--blue);
  }
  .stat span {
    font-size: 0.7rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
    font-family: var(--sans);
  }
  .insight {
    font-family: var(--sans);
    font-size: 0.92rem;
    background: #eef3fd;
    border: var(--border);
    border-left: 6px solid var(--blue);
    padding: 11px 13px;
    border-radius: 8px;
    margin-top: 16px;
    color: var(--ink);
  }
  .toolbar {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
  }
  .essay {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-top: 22px;
    background: var(--blue);
    color: #fff;
    text-decoration: none;
    border: var(--border);
    border-radius: 14px;
    padding: 16px;
    box-shadow: 4px 4px 0 var(--ink);
    transition:
      transform 0.05s,
      box-shadow 0.05s;
  }
  .essay:hover {
    background: #3a6bd0;
  }
  .essay:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--ink);
  }
  .essay-thumb {
    flex: none;
    width: 92px;
    height: 92px;
    object-fit: cover;
    border: var(--border);
    border-radius: 10px;
    background: #fff;
  }
  .essay-body {
    min-width: 0;
  }
  .essay-kicker {
    font-family: var(--slab);
    font-weight: 500;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.85;
  }
  .essay h3 {
    font-family: var(--display);
    text-transform: uppercase;
    font-size: 1.5rem;
    margin: 4px 0 6px;
    -webkit-text-stroke: 0.4px var(--ink);
    paint-order: stroke fill;
    line-height: 1;
  }
  .essay p {
    margin: 0;
    font-weight: 500;
  }
  .essay .arrow {
    display: inline-block;
    transition: transform 0.15s;
  }
  .essay:hover .arrow {
    transform: translateX(4px);
  }
  .disclaimer {
    font-size: 0.78rem;
    color: var(--muted);
    margin-top: 24px;
    border-top: 1.5px solid var(--ink);
    padding-top: 14px;
  }
  .empty {
    color: var(--muted);
    text-align: center;
    padding: 40px 10px;
  }
  @media (max-width: 560px) {
    .card {
      padding: 14px;
      box-shadow: 3px 3px 0 var(--ink);
    }
    textarea {
      min-height: 150px;
    }
    .stats {
      gap: 8px;
    }
    .stat b {
      font-size: 1.3rem;
    }
    .stat span {
      font-size: 0.62rem;
      letter-spacing: 0.4px;
    }
  }
</style>
