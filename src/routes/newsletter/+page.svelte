<script lang="ts">
  const ENDPOINT = 'https://homolova-sk.vercel.app/api/subscribe';

  type NewsletterId = 'ada-essays' | 'the-pond';
  const NEWSLETTERS: { id: NewsletterId; title: string; body: string; href: string; external?: boolean }[] = [
    {
      id: 'ada-essays',
      title: "Hi! It's Ada",
      body: 'Personal essays, often accompanied by research and data analysis.',
      href: '/'
    },
    {
      id: 'the-pond',
      title: 'The Pond',
      body: 'Data training, tips, and techniques for aspiring data professionals.',
      href: 'https://datafrosch.beehiiv.com/',
      external: true
    }
  ];

  let email = $state('');
  // Honeypot — hidden from users, bots that scrape the form will fill it.
  // The Vercel endpoint should reject any submission where this is non-empty.
  let website = $state('');
  let selected = $state(new Set<NewsletterId>(NEWSLETTERS.map((n) => n.id)));
  let result = $state<
    | { kind: 'idle' | 'submitting' | 'success' }
    | { kind: 'error'; msg: string }
  >({ kind: 'idle' });

  function toggle(id: NewsletterId, on: boolean) {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    selected = next;
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    // Bot caught by honeypot — pretend success, drop silently.
    if (website) {
      result = { kind: 'success' };
      return;
    }
    const newsletters = [...selected];
    if (newsletters.length === 0) {
      result = { kind: 'error', msg: 'pick at least one newsletter' };
      return;
    }
    result = { kind: 'submitting' };
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newsletters, website })
      });
      if (!res.ok) throw new Error(`subscription failed: ${res.status}`);
      result = { kind: 'success' };
      email = '';
      selected = new Set(NEWSLETTERS.map((n) => n.id));
    } catch (err) {
      console.error(err);
      result = { kind: 'error', msg: 'something went wrong — try again later' };
    }
  }
</script>

<svelte:head>
  <title>Subscribe — homolova.sk</title>
  <meta
    name="description"
    content="Subscribe to Ada Homolova's newsletters: Hi! It's Ada (essays + data) and The Pond (data training)."
  />
</svelte:head>

<section class="np">
  <header class="np__hero">
    <h1>In your inbox</h1>
    <p class="np__sub">
      Personal essays, data analysis, the EU. Sent only when there's something worth saying.
    </p>
  </header>

  <form class="np__form" onsubmit={submit} novalidate>
    <div class="np__honeypot" aria-hidden="true">
      <label for="np-website">Website (leave empty)</label>
      <input
        id="np-website"
        type="text"
        name="website"
        bind:value={website}
        tabindex="-1"
        autocomplete="off"
      />
    </div>

    <label class="np__field">
      <span class="np__label">Email</span>
      <input
        type="email"
        bind:value={email}
        required
        placeholder="your@email.com"
        autocomplete="email"
      />
    </label>

    <fieldset class="np__list">
      <legend class="sr-only">Choose newsletters</legend>

      {#each NEWSLETTERS as n (n.id)}
        <label class="np__card">
          <input
            type="checkbox"
            checked={selected.has(n.id)}
            onchange={(e) => toggle(n.id, e.currentTarget.checked)}
          />
          <div>
            <strong>{n.title}</strong>
            <p>
              {n.body}
              <a
                href={n.href}
                class="np__inline"
                target={n.external ? '_blank' : undefined}
                rel={n.external ? 'noopener' : undefined}
              >Read it here →</a>
            </p>
          </div>
        </label>
      {/each}
    </fieldset>

    <button type="submit" class="btn" disabled={result.kind === 'submitting'}>
      {result.kind === 'submitting' ? 'subscribing…' : '→ subscribe'}
    </button>

    {#if result.kind === 'success'}
      <p class="np__msg np__msg--ok" role="status">Subscribed. Welcome.</p>
    {:else if result.kind === 'error'}
      <p class="np__msg np__msg--err" role="status">{result.msg}</p>
    {/if}
  </form>
</section>

<style>
  .np {
    max-width: 38rem;
    margin: 64px auto 96px;
    padding: 0 4px;
  }
  .np__hero {
    margin-bottom: 40px;
  }
  .np__hero h1 {
    font-family: var(--display);
    text-transform: uppercase;
    font-size: clamp(2.4rem, 7vw, 4.5rem);
    line-height: 0.95;
    letter-spacing: -0.01em;
    margin: 0;
    color: var(--pink);
    -webkit-text-stroke: 2px var(--ink);
    paint-order: stroke fill;
  }
  .np__sub {
    margin: 18px 0 0;
    font-size: 18px;
    line-height: 1.5;
    color: var(--body);
    max-width: 32rem;
  }

  .np__form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .np__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .np__label {
    font-family: var(--sans);
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.08em;
    color: var(--body-soft);
    font-weight: 600;
  }
  .np__field input[type='email'] {
    width: 100%;
    padding: 14px 16px;
    border: var(--border);
    background: var(--bg);
    color: var(--ink);
    font-family: var(--sans);
    font-size: 16px;
    border-radius: 0;
  }
  .np__field input[type='email']:focus {
    outline: none;
    background: var(--card);
  }

  .np__list {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .np__card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    background: var(--card);
    border: var(--border);
    cursor: pointer;
    transition: background 160ms ease-out;
  }
  .np__card:hover { background: #fbe7da; }
  .np__card input[type='checkbox'] {
    margin-top: 4px;
    width: 18px;
    height: 18px;
    accent-color: var(--pink);
    flex-shrink: 0;
  }
  .np__card strong {
    display: block;
    font-family: var(--display);
    text-transform: uppercase;
    font-size: 18px;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }
  .np__card p {
    margin: 0;
    font-size: 14px;
    color: var(--body-soft);
    line-height: 1.5;
  }
  .np__inline {
    color: var(--ink);
    border-bottom: 2px solid var(--pink);
    padding-bottom: 1px;
    font-weight: 500;
  }
  .np__inline:hover { background: var(--pink); }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 22px;
    border: var(--border);
    background: var(--pink);
    color: var(--ink);
    font-family: var(--display);
    font-size: 18px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    cursor: pointer;
    align-self: flex-start;
    box-shadow: 4px 4px 0 var(--ink);
    transition: transform 140ms ease-out, box-shadow 140ms ease-out, background 140ms ease-out;
  }
  .btn:hover:not(:disabled) {
    background: var(--mint);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--ink);
  }
  .btn:active:not(:disabled) {
    transform: translate(4px, 4px);
    box-shadow: 0 0 0 var(--ink);
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .np__msg {
    margin: 0;
    padding: 12px 16px;
    border: var(--border);
    font-size: 14px;
  }
  .np__msg--ok { background: var(--mint); }
  .np__msg--err { background: #ffd7d7; }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Honeypot — visually hidden but still in the DOM so bots fill it. */
  .np__honeypot {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  @media (max-width: 540px) {
    .np { margin: 40px auto 64px; }
    .np__hero h1 { font-size: 2.4rem; }
    .np__sub { font-size: 16px; }
  }
</style>
