<!--
  Chart placeholder. Shows the spec from article.md so we know what each slot
  will become. Replace with the real chart component when ready.

  Props:
    title    — chart title / kind ("Lollipop: CO₂ per kg of protein")
    takeaway — one-line message the chart should land
    source   — citation / data source label
    step     — optional active step index (used inside scrollies)
    steps    — optional array of { label, desc } step specs

  Usage:
    <Placeholder
      title="Emissions treemap"
      takeaway="Animal production emits a lot of greenhouse gases"
      source="Poore & Nemecek 2018"
    />
-->
<script>
  let {
    title = 'Chart placeholder',
    takeaway = '',
    source = '',
    step = null,
    steps = null,
  } = $props();
</script>

<figure class="placeholder">
  <div class="frame">
    <p class="kind">{title}</p>
    {#if takeaway}
      <p class="takeaway">{takeaway}</p>
    {/if}

    {#if steps && steps.length}
      <ol class="steps">
        {#each steps as s, i}
          <li class:active={step === i}>
            <span class="step-label">{s.label}</span>
            <span class="step-desc">{s.desc}</span>
          </li>
        {/each}
      </ol>
    {/if}

    {#if source}
      <p class="source">Source: {source}</p>
    {/if}
  </div>
</figure>

<style>
  .placeholder {
    width: 100%;
    margin: 0;
    display: grid;
    place-items: center;
  }
  .frame {
    width: 100%;
    max-width: 720px;
    padding: 1.5rem 1.75rem;
    border: 1.5px dashed var(--surface-stone);
    border-radius: 8px;
    background: var(--surface-cream);
    color: var(--text-on-light);
  }
  .kind {
    font-family: var(--sans);
    font-size: 0.75rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-kidney);
    margin: 0 0 0.5rem;
  }
  .takeaway {
    font-family: var(--serif);
    font-size: 1.05rem;
    line-height: 1.4;
    margin: 0;
    color: var(--text-on-light);
  }
  .steps {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    display: grid;
    gap: 0.4rem;
  }
  .steps li {
    font-family: var(--sans);
    font-size: 0.85rem;
    color: var(--text-on-light-muted);
    padding: 0.5rem 0.75rem;
    border-left: 3px solid var(--surface-stone);
    background: var(--surface-linen);
    transition: border-color 0.3s ease, background 0.3s ease, color 0.3s ease;
  }
  .steps li.active {
    border-left-color: var(--color-coral-lentil);
    background: var(--surface-parchment);
    color: var(--text-on-light);
  }
  .step-label {
    display: inline-block;
    min-width: 4.5rem;
    font-weight: 600;
    color: var(--color-kidney);
  }
  .source {
    font-family: var(--sans);
    font-size: 0.75rem;
    color: var(--text-on-light-muted);
    margin: 1rem 0 0;
  }
</style>
