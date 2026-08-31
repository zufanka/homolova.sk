<script lang="ts">
  let { accent = 'var(--accent, var(--pink))' }: { accent?: string } = $props();
</script>

<aside class="inline-cta" style:--cta-accent={accent}>
  <p class="inline-cta__copy">Enjoying this? I write an essay once a month.</p>
  <a href="/newsletter" class="inline-cta__link">Subscribe for the next one</a>
</aside>

<style>
  /* Quiet sibling of SubscribeCta: the family frame (1.5px ink border, cream
     card) with none of the shouting — no display face, no button. The action
     uses the footer link recipe (2px accent underline, hover fill). Lives
     inside .post-body, so scoped selectors must beat `.post-body a` / `p`
     for border, text-decoration, margins. */
  .inline-cta {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.3rem 0.9rem;
    border: var(--border);
    background: var(--card);
    padding: 0.75rem 1.1rem;
    margin: 2.75rem 0;
  }
  .inline-cta__copy {
    margin: 0;
    font-family: var(--slab);
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--body);
  }
  .inline-cta__link {
    font-family: var(--sans);
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--ink);
    text-decoration: none;
    white-space: nowrap;
    border-bottom: 2px solid var(--cta-accent, var(--pink));
    padding-bottom: 1px;
    transition: background 160ms ease-out;
  }
  .inline-cta__link:hover {
    background: var(--cta-accent, var(--pink));
  }
</style>
