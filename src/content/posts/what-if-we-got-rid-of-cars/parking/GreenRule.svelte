<!--
  The 3-30-300 figure: how much of Europe's urban population actually lives
  under the rule — 15% meet all three parts, 64% meet some, 21% meet none.
  Static — no state, no props, no client JS, no D3. The numbers come from the
  2026 Nature Communications study of 862 European cities cited in the caption.

  15 and 21 are the study's own figures ("fewer than 15%" and "21%"); 64 is the
  remainder, so the three sum to 100 by construction. No decimals — the source
  doesn't carry that precision and neither should the ring.
-->
<script module lang="ts">
  /**
   * Geometry is derived from the three shares below, not hand-placed, so the
   * wedges and their leader lines stay correct if the numbers are ever
   * restated. Everything runs once at module scope — which is Node during the
   * static prerender, so nothing here may touch `window` or `document`.
   */
  const SLICES = [
    // Green is this piece's colour for urban green everywhere else, purple its
    // colour for car infrastructure, so the two poles keep their meaning here.
    // The middle is deliberately NOT a third hue: it's the paper tone, the same
    // fill <TreesAreCool /> gives its "back to the sky" band, so the two
    // coloured wedges read as the poles and "some" reads as neither.
    { pct: 15, label: 'meet all three', fill: 'var(--park, #0a6b40)' },
    { pct: 64, label: 'meet some', fill: 'var(--plate, #fdf5f0)' },
    { pct: 21, label: 'meet none', fill: 'var(--asphalt, #7d4a9e)' }
  ];

  // viewBox units. The SVG scales to its container, so these are ratios, not
  // pixels — and that ties the two ends of the range together: rendered type =
  // font units x (container / 400). A 320px phone leaves this figure about
  // 230px, so the 21rem cap in the stylesheet below is what keeps the labels
  // from swelling past the prose on a desktop while still clearing ~11px on
  // the phone. Changing one without the other breaks the other end.
  const CX = 190;
  const CY = 106;
  const R = 66; // outer radius of the ring
  const RI = 39; // inner radius — the hole, which holds the rule's name
  const ELBOW = R + 14; // where a leader line turns away from the ring
  const JOG = 22; // how far it runs after the turn
  const GAP = 6; // and how far the text sits past the end of the jog
  const LINE = 22; // baseline-to-baseline inside a two-line label

  const round = (n: number) => Math.round(n * 100) / 100;
  const rad = (deg: number) => (deg * Math.PI) / 180;

  // Angles run clockwise from 12 o'clock, which is how a reader scans a ring —
  // so sin drives x and -cos drives y, rather than the usual maths convention.
  const pt = (r: number, deg: number): [number, number] => [
    round(CX + r * Math.sin(rad(deg))),
    round(CY - r * Math.cos(rad(deg)))
  ];

  /** One donut segment as a closed path: out along the arc, in, back along the
   *  inner arc. The inner arc sweeps the other way (sweep-flag 0) to return to
   *  the start; large-arc-flag has to be set past a half turn, which the 64%
   *  wedge (230.4°) is. */
  function segment(a0: number, a1: number): string {
    const [ox0, oy0] = pt(R, a0);
    const [ox1, oy1] = pt(R, a1);
    const [ix1, iy1] = pt(RI, a1);
    const [ix0, iy0] = pt(RI, a0);
    const large = a1 - a0 > 180 ? 1 : 0;
    return (
      `M${ox0} ${oy0}A${R} ${R} 0 ${large} 1 ${ox1} ${oy1}` +
      `L${ix1} ${iy1}A${RI} ${RI} 0 ${large} 0 ${ix0} ${iy0}Z`
    );
  }

  let cursor = 0;
  const wedges = SLICES.map((s) => {
    const a0 = cursor;
    const a1 = cursor + s.pct * 3.6; // 1% = 3.6° of the full turn
    cursor = a1;
    const mid = (a0 + a1) / 2;

    const [sx, sy] = pt(R + 4, mid); // leader starts just clear of the ring
    const [ex, ey] = pt(ELBOW, mid); // and turns here
    const side = Math.sin(rad(mid)); // > 0 = right of centre, < 0 = left

    // Near 12 or 6 o'clock a horizontal jog would double back across the ring,
    // so those labels drop straight out and centre themselves instead. The 64%
    // wedge's midpoint sits at 169°, which is exactly that case.
    if (Math.abs(side) < 0.35) {
      const dir = -Math.cos(rad(mid)) > 0 ? 1 : -1; // 1 = below the ring
      const ty = round(ey + JOG * dir);
      return {
        ...s,
        d: segment(a0, a1),
        leader: `M${sx} ${sy}L${ex} ${ey}L${ex} ${ty}`,
        tx: ex,
        // +21 rather than the cap height, so the leader stops clear of the
        // digits instead of grazing their tops
        ty: round(dir > 0 ? ty + 21 : ty - LINE - 11),
        anchor: 'middle'
      };
    }

    const tx = round(ex + JOG * Math.sign(side));
    return {
      ...s,
      d: segment(a0, a1),
      leader: `M${sx} ${sy}L${ex} ${ey}L${tx} ${ey}`,
      tx: round(tx + GAP * Math.sign(side)),
      ty: round(ey + 8), // the elbow lands between the label's two lines
      anchor: side > 0 ? 'start' : 'end'
    };
  });
</script>

<figure class="greenrule">
  <!-- A div, not a <p>, for the same reason the sibling figure uses one: this
       line is a figure intro, not prose, and wants the muted treatment. The
       "not the share of cities" is load-bearing — the study counts people. -->
  <div class="grintro">
    Share of the population, by how much of the rule the neighbourhood they live in
    meets — not the share of cities.
  </div>

  <svg
    viewBox="0 0 400 264"
    role="img"
    aria-label="Of the people living in 862 European cities, 15 percent are in a neighbourhood that meets all three parts of the 3-30-300 rule, 64 percent meet some of it, and 21 percent meet none."
  >
    {#each wedges as w (w.label)}
      <!-- The rest of this piece separates every fill with a 1.5px ink outline
           rather than a gap, and the pale middle wedge would otherwise vanish
           into the white page — so the outline is doing real work here, not
           just decoration. non-scaling-stroke keeps it at exactly 1.5px at
           every container width, the way the CSS borders elsewhere are. -->
      <path d={w.d} fill={w.fill} stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      <path
        d={w.leader}
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        vector-effect="non-scaling-stroke"
      />
      <!-- Labels stay in ink and muted grey rather than taking their wedge's
           colour: the pale middle would be unreadable as text, and the leader
           line already ties each label to its wedge, so identity never rests
           on colour alone. -->
      <text class="pct" x={w.tx} y={w.ty} text-anchor={w.anchor}>{w.pct}%</text>
      <text class="lab" x={w.tx} y={w.ty + LINE} text-anchor={w.anchor}>{w.label}</text>
    {/each}

    <!-- The hole names the rule rather than repeating a number: a title, not a
         datum. The caption below spells out what the three figures mean. -->
    <text class="rule" x={CX} y={CY - 1} text-anchor="middle">3-30-300</text>
    <text class="rulesub" x={CX} y={CY + 13} text-anchor="middle">the rule</text>
  </svg>

  <figcaption>
    The 3-30-300 rule: three trees visible from every home, 30% canopy cover in the
    neighbourhood, a public green space within 300 m. Shares are of the population of
    the 862 European cities in
    <a href="https://www.nature.com/articles/s41467-026-71523-8"
      >Nature Communications (2026)</a
    >. 15% and 21% are the study's; 64% is the remainder.
  </figcaption>
</figure>

<style>
  .greenrule {
    margin: 1.8rem 0;
    max-width: none;
  }
  .grintro {
    font-size: 0.82rem;
    font-weight: 400;
    color: var(--muted);
    margin: 0 0 0.6rem;
    max-width: var(--measure);
  }
  /* The viewBox does the responsive work: width:100% with height:auto can't
     overflow its column at any viewport. The cap is the other half of the
     type-size bargain described in the script — raising it makes the labels
     outgrow the prose they sit in. */
  svg {
    display: block;
    width: 100%;
    max-width: 21rem;
    height: auto;
    margin-inline: auto;
    /* the wedge outlines and the leader lines both paint with currentColor, so
       the ink weight of the whole drawing is set in one place */
    color: var(--ink);
  }
  .pct {
    font-family: var(--sans);
    font-size: 24px;
    font-weight: 700;
    fill: var(--ink);
  }
  .lab {
    font-family: var(--sans);
    font-size: 19px;
    font-weight: 500;
    fill: var(--muted);
  }
  .rule {
    font-family: var(--display);
    font-size: 14px;
    fill: var(--ink);
  }
  .rulesub {
    font-family: var(--sans);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.04em;
    fill: var(--muted);
  }
  figcaption {
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--muted);
    margin-top: 0.9rem;
    max-width: var(--measure);
  }
  figcaption a {
    border-bottom: 1.5px solid var(--orange);
  }
</style>
