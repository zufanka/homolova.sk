<!--
  The energy-balance illustration from the "Why trees are cool" section:
  where the 850 W/m² of midday summer sunlight goes on asphalt, and where it
  goes in a planted park. Static — no state, no props. The surrounding
  paragraphs stay in the post's prose; only the figure and its labels live here.

  Segment heights are the prototype's, in px: 1 W/m² = 0.306 px, so both stacks
  sum to the same 850 W/m² and the two columns are directly comparable.
-->
<figure class="energy">
  <p class="ebintro">
    850 W/m² of midday summer sunshine, with clear skies. Park at 50% canopy,
    well watered — a water-stressed tree stops sweating.
  </p>
  <div class="ebgrid">
    <div class="ebcol">
      <h3 class="asphalt-h">Asphalt</h3>
      <div class="ebstack">
        <div class="ebseg sky" style="height:107.1px">
          <span>Reflected and radiated away</span><span>350 W/m²</span>
        </div>
        <div class="ebseg air" style="height:91.8px">
          <span>Heating the air</span><span>300 W/m²</span>
        </div>
        <div class="ebseg ground" style="height:61.2px">
          <span>Into the ground</span><span>200 W/m²</span>
        </div>
      </div>
    </div>
    <div class="ebcol">
      <h3 class="planted">Well watered park</h3>
      <div class="ebstack">
        <div class="ebseg sky" style="height:84.15px">
          <span>Reflected and radiated away</span><span>275 W/m²</span>
        </div>
        <div class="ebseg water" style="height:122.4px">
          <span>Evaporating water</span><span>400 W/m²</span>
        </div>
        <div class="ebseg air" style="height:38.25px">
          <span>Heating the air</span><span>125 W/m²</span>
        </div>
        <div class="ebseg ground" style="height:15.3px">50 W/m²</div>
      </div>
    </div>
  </div>
  <figcaption>
Illustrative values for clear-sky midday summer conditions at mid-latitudes<br>
Sources: Oke et al. (2017);  Anandakumar (1999) Spronken-Smith et al. (2000).<br>
The asphalt "reflected and radiated" figure is mostly heat radiated, not reflected light.
  </figcaption>
</figure>

<style>
  .energy {
    margin: 1.8rem 0;
    max-width: none;
  }
  .ebintro {
    font-size: 0.82rem;
    font-weight: 400;
    /* Correct in isolation, but the host post's ".why :global(p)" rule
       currently reaches through the component boundary and out-specifies
       this (it targets every <p>, including ones inside child components,
       and beats a single-class selector like .ebintro on specificity).
       This will resolve once that rule moves to container inheritance
       (.why { color: var(--body) }) on the post side — no change needed
       here when that lands. */
    color: var(--muted);
    margin: 0 0 1rem;
    max-width: var(--measure);
  }
  .ebgrid {
    display: grid;
    gap: 1.2rem;
    grid-template-columns: 1fr 1fr;
  }
  .ebcol {
    /* Grid items default to min-width: auto, which floors a track at its
       content's min-content size. The segment labels below used to be
       nowrap, giving them a wide min-content width, so without this the
       columns refused to shrink past that and blew out the grid on narrow
       viewports. */
    min-width: 0;
  }
  .ebcol h3 {
    font-family: var(--display);
    font-size: 1rem;
    margin: 0 0 0.6rem;
    color: var(--ink);
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
    gap: 0.4rem;
    padding: 0 0.5rem;
    border: 1.5px solid var(--ink);
    font-size: 0.78rem;
    font-weight: 500;
    line-height: 1.2;
    overflow: hidden;
  }
  /* The label can wrap onto a second line as columns narrow — every
     labelled segment is tall enough to fit two lines at this font size.
     The value stays on one line; it's short and needs the room less. */
  .ebseg > span:first-child {
    min-width: 0;
    white-space: normal;
  }
  .ebseg > span:last-child {
    flex: none;
    white-space: nowrap;
  }
  @media (max-width: 480px) {
    .ebseg {
      font-size: 0.68rem;
      padding: 0 0.35rem;
    }
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
