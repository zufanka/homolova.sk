<script lang="ts">
  let { accent = 'var(--pink)' }: { accent?: string } = $props();
</script>

<div class="cta" style:--cta-accent={accent}>
  <h2 class="cta__heading">Enjoyed this?</h2>
  <p class="cta__pitch">I write an essay once a month</p>
  <a href="/newsletter" class="cta__button">Subscribe for the next one</a>
</div>

<style>
  .cta {
    border: var(--border);
    background: var(--card);
    padding: 2.5rem 1.5rem;
    text-align: center;
  }
  .cta__heading {
    font-family: var(--site-display);
    text-transform: uppercase;
    font-size: clamp(1.25rem, 3.5vw, 1.75rem);
    line-height: 1.1;
    letter-spacing: -0.01em;
    color: var(--cta-accent, var(--pink));
    -webkit-text-stroke: 1.5px var(--ink);
    paint-order: stroke fill;
    margin: 0 0 1rem;
  }
  .cta__pitch {
    font-family: var(--slab);
    font-size: 1rem;
    color: var(--body);
    line-height: 1.5;
    max-width: 34rem;
    margin: 0 auto 1.75rem;
  }
  .cta__button {
    display: inline-block;
    font-family: var(--sans);
    font-weight: 600;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--ink);
    background: var(--bg);
    border: var(--border);
    border-bottom: 4px solid var(--cta-accent, var(--pink));
    padding: 0.65rem 1.5rem;
    transition: background 160ms ease-out;
  }
  .cta__button:hover {
    background: var(--cta-accent, var(--pink));
  }
</style>
