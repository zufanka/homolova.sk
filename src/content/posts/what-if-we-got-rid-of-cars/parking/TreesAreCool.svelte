<!--
  The energy-balance illustration from the "Why trees are cool" section:
  where the 850 W/m² of midday summer sunlight goes on asphalt, and where it
  goes in a planted park. Static — no state, no props. The surrounding
  paragraphs stay in the post's prose; only the figure and its labels live here.

  Segment heights are the prototype's, in px: 1 W/m² = 0.306 px, so both stacks
  sum to the same 850 W/m² and the two columns are directly comparable.
-->
<figure class="energy">
  <div class="ebgrid">
    <div class="ebcol">
      <h3 class="asphalt-h">Asphalt</h3>
      <p class="ebsub">Midday, clear July sky</p>
      <div class="ebstack">
        <div class="ebseg sky" style="height:76.5px">
          <span>Back to the sky</span><span>250 W/m²</span>
        </div>
        <div class="ebseg air" style="height:128.5px">
          <span>Heating the air</span><span>420 W/m²</span>
        </div>
        <div class="ebseg ground" style="height:55.1px">
          <span>Into the ground</span><span>180 W/m²</span>
        </div>
      </div>
    </div>
    <div class="ebcol">
      <h3 class="planted">Planted park</h3>
      <p class="ebsub">50% canopy, well watered</p>
      <div class="ebstack">
        <div class="ebseg sky" style="height:82.6px">
          <span>Back to the sky</span><span>270 W/m²</span>
        </div>
        <div class="ebseg water" style="height:107.1px">
          <span>Evaporating water</span><span>350 W/m²</span>
        </div>
        <div class="ebseg air" style="height:61.2px">
          <span>Heating the air</span><span>200 W/m²</span>
        </div>
        <div class="ebseg ground" style="height:9.2px"></div>
      </div>
    </div>
  </div>
  <div class="eblegend">
    <span><i class="sky"></i>Back to the sky</span>
    <span><i class="water"></i>Evaporating water</span>
    <span><i class="air"></i>Heating the air</span>
    <span><i class="ground"></i>Stored in the ground</span>
    <span class="tot">Both bars = 850 W/m² of arriving sunlight</span>
  </div>
  <figcaption>
    Typical midday summer values, compiled from
    <a
      href="https://journals.ametsoc.org/view/journals/apme/41/7/1520-0450_2002_041_0792_thfiua_2.0.co_2.xml"
      >Grimmond &amp; Oke (2002)</a
    >
    and
    <a
      href="https://rmets.onlinelibrary.wiley.com/doi/pdf/10.1002/1097-0088(200007)20:9%3C1033::AID-JOC508%3E3.0.CO;2-U"
      >Spronken-Smith &amp; Oke (2000)</a
    >. Illustrative, not a single measurement.
  </figcaption>
</figure>

<style>
  .energy {
    margin: 1.8rem 0;
    max-width: none;
  }
  .ebgrid {
    display: grid;
    gap: 1.2rem;
    grid-template-columns: 1fr 1fr;
  }
  .ebcol h3 {
    font-family: var(--display);
    font-size: 1rem;
    margin: 0;
    color: var(--ink);
  }
  .ebsub {
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--muted);
    margin: 0.2rem 0 0.6rem;
  }
  .ebstack {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ebseg {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.5rem;
    border: 1.5px solid var(--ink);
    font-size: 0.78rem;
    font-weight: 500;
    overflow: hidden;
    white-space: nowrap;
  }
  .ebseg.sky {
    background: var(--card);
    color: var(--ink);
  }
  .ebseg.water {
    background: #5aa8d8;
    color: var(--ink);
  }
  /* the same purple the maps and the ranking give car infrastructure — heating
     the air is what the asphalt does, so it wears the asphalt's colour. Ink on
     it only reaches 3.3:1, so these labels flip to white. */
  .ebseg.air {
    background: var(--asphalt, #7d4a9e);
    color: #fff;
  }
  .ebseg.ground {
    background: var(--ink);
    color: #fff;
  }
  .eblegend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.1rem;
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: 0.9rem;
  }
  .eblegend span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .eblegend i {
    width: 0.85rem;
    height: 0.85rem;
    border: 1.5px solid var(--ink);
    display: block;
    flex: none;
  }
  .eblegend i.sky {
    background: var(--card);
  }
  .eblegend i.water {
    background: #5aa8d8;
  }
  .eblegend i.air {
    background: var(--asphalt, #7d4a9e);
  }
  .eblegend i.ground {
    background: var(--ink);
  }
  .eblegend .tot {
    color: var(--muted);
    font-weight: 400;
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
