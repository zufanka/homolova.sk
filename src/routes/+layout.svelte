<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import type { LayoutMeta } from '$lib/posts';
  import {
    SITE_URL,
    SITE_TITLE,
    SITE_DESCRIPTION,
    DEFAULT_OG_IMAGE,
    absoluteUrl
  } from '$lib/site';
  import '@fontsource/bowlby-one/400.css';
  import '@fontsource/roboto/400.css';
  import '@fontsource/roboto/500.css';
  import '@fontsource/roboto/600.css';
  import '@fontsource/roboto-slab/500.css';
  import '@fontsource/roboto-slab/700.css';

  let { children } = $props();
  const meta = $derived((page.data as { meta?: LayoutMeta })?.meta);
  const bare = $derived(Boolean(meta?.fullBleed));
  const headerFill = $derived(meta?.headerFill ?? meta?.titleFill ?? 'var(--pink)');

  const ogTitle = $derived(meta?.ogTitle ?? SITE_TITLE);
  const ogDescription = $derived(meta?.ogDescription ?? SITE_DESCRIPTION);
  const ogType = $derived(meta?.ogType ?? 'website');
  const ogImage = $derived(absoluteUrl(meta?.ogImage ?? DEFAULT_OG_IMAGE));
  const canonical = $derived(
    absoluteUrl(meta?.canonical ?? page.url.pathname)
  );

  const websiteJsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_TITLE,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      author: {
        '@type': 'Person',
        name: 'Ada Homolova',
        url: `${SITE_URL}/hello`
      }
    })
  );
  const showSubscribeBar = $derived(page.url.pathname !== '/newsletter');
  const footerBarBg = $derived(meta?.footerBg ?? 'var(--card)');
  const footerSiteBg = $derived(meta?.footerBg ?? 'var(--bg)');
  const footerAccent = $derived(meta?.footerAccent ?? 'var(--pink)');

  // Mail address is assembled client-side so the prerendered HTML never
  // contains the literal address — keeps simple scrapers from harvesting it.
  let emailDisplay = $state('hello [at] homolova [dot] sk');
  let emailHref = $state<string | undefined>(undefined);

  onMount(() => {
    const user = 'hello';
    const domain = 'homolova.sk';
    emailDisplay = `${user}@${domain}`;
    emailHref = `mailto:${user}@${domain}`;
  });

  onMount(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('[data-parallax]')
    ).map((el) => ({ el, rate: parseFloat(el.dataset.parallax ?? '0') }));
    if (!targets.length) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        for (const { el, rate } of targets) {
          el.style.transform = `translateY(${y * rate}px)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<svelte:head>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href="/rss.xml" />
  <link rel="canonical" href={canonical} />
  <meta name="description" content={ogDescription} />
  <meta property="og:title" content={ogTitle} />
  <meta property="og:description" content={ogDescription} />
  <meta property="og:type" content={ogType} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:site_name" content={SITE_TITLE} />
  <meta name="twitter:card" content="summary_large_image" />
  {@html `<script type="application/ld+json">${websiteJsonLd}</script>`}
  <script
    async
    defer
    src="https://cloud.umami.is/script.js"
    data-website-id="e926cc39-ba91-4db2-a2f2-57cf2289b43a"
    data-auto-track="true"
    data-do-not-track="true"
    data-cache="false"
  ></script>
</svelte:head>

{#snippet footerLinks()}
  <span class="footer__cc">
    <img src="/icons/cc.svg" alt="" class="footer__cc-icon" />
    {new Date().getFullYear()} Ada Homolova
    &nbsp;·&nbsp;
    <a
      href="https://creativecommons.org/licenses/by-sa/4.0/?ref=chooser-v1"
      target="_blank"
      rel="license noopener"
    >CC BY-SA 4.0</a>
  </span>
  <span>
    <a href={emailHref}>{emailDisplay}</a>
    &nbsp;·&nbsp;
    <a href="/">home</a>
    &nbsp;·&nbsp;
    <a href="/hello">about</a>
    &nbsp;·&nbsp;
    <a href="/rss.xml">rss</a>
  </span>
{/snippet}

<header class="nav" class:nav--bare={bare}>
  <div class="nav__inner">
    <a href="/" class="nav__mark" style:--mark-fill={headerFill}>Hey it's Ada</a>
  </div>
</header>

<main class:bare>
  {@render children()}
</main>

{#if showSubscribeBar}
  <aside
    class="subscribe-bar"
    style:background={footerBarBg}
    style:--footer-accent={footerAccent}
  >
    <div class="subscribe-bar__inner">
      <span class="subscribe-bar__copy">Want this in your inbox?</span>
      <a href="/newsletter" class="subscribe-bar__cta">subscribe →</a>
    </div>
  </aside>
{/if}

<footer
  class="site-footer"
  style:background={footerSiteBg}
  style:--footer-accent={footerAccent}
>
  <div class="footer__inner">
    {@render footerLinks()}
  </div>
</footer>

<style>
  :global(:root) {
    --bg: #ffffff;
    --card: #fdf5f0;
    --ink: #020202;
    --pink: #ff8bb8;
    --mint: #02f585;
    --blue: #5b8bee;
    --yellow: #ffec00;
    --orange: #ff8a1f;
    --muted: #666;
    --body: #222;
    --body-soft: #444;
    --border: 1.5px solid var(--ink);
    --container: 60rem;
    --display: 'Bowlby One', system-ui, sans-serif;
    --slab: 'Roboto Slab', Georgia, serif;
    --sans: 'Roboto', system-ui, sans-serif;
  }
  :global(*) { box-sizing: border-box; }
  :global(html), :global(body) { margin: 0; padding: 0; }
  :global(body) {
    background: var(--bg);
    color: var(--ink);
    font-family: var(--sans);
    font-weight: 400;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  :global(a) { color: inherit; text-decoration: none; }
  :global(img) { max-width: 100%; height: auto; }
  :global(a:focus-visible),
  :global(button:focus-visible),
  :global(input:focus-visible),
  :global(textarea:focus-visible),
  :global([tabindex]:focus-visible) {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }

  .nav {
    background: var(--bg);
  }
  .nav--bare {
    background: transparent;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    pointer-events: none;
  }
  .nav--bare .nav__mark {
    pointer-events: auto;
  }
  .nav__inner {
    max-width: var(--container);
    margin: 0 auto;
    padding: 22px 24px 18px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .nav__mark {
    font-family: var(--display);
    text-transform: uppercase;
    color: var(--mark-fill, var(--pink));
    -webkit-text-stroke: 1.5px var(--ink);
    paint-order: stroke fill;
    font-size: clamp(22px, 3.4vw, 30px);
    letter-spacing: -0.01em;
    line-height: 1;
  }

  main {
    max-width: var(--container);
    margin: 0 auto;
    padding: 0 24px;
  }

  .subscribe-bar {
    border-top: var(--border);
  }
  .subscribe-bar__inner {
    max-width: var(--container);
    margin: 0 auto;
    padding: 26px 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 22px;
    flex-wrap: wrap;
  }
  .subscribe-bar__copy {
    font-family: var(--display);
    text-transform: uppercase;
    font-size: clamp(18px, 2.4vw, 24px);
    letter-spacing: -0.01em;
    color: var(--ink);
  }
  .subscribe-bar__cta {
    border-bottom: 3px solid var(--footer-accent, var(--pink));
    padding: 0 2px 1px;
    font-weight: 600;
    font-size: 16px;
    transition: background 160ms ease-out;
  }
  .subscribe-bar__cta:hover { background: var(--footer-accent, var(--pink)); }

  .site-footer {
    border-top: var(--border);
  }
  .footer__inner {
    max-width: var(--container);
    margin: 0 auto;
    padding: 28px 24px 64px;
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    justify-content: space-between;
    font-size: 14px;
    color: var(--body-soft);
  }
  .footer__cc {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .footer__cc-icon {
    width: 16px;
    height: 16px;
    display: inline-block;
  }
  .footer__inner a {
    border-bottom: 2px solid var(--footer-accent, var(--pink));
    padding-bottom: 1px;
  }
  .footer__inner a:hover { background: var(--footer-accent, var(--pink)); color: var(--ink); }

  main.bare {
    max-width: none;
    margin: 0;
    padding: 0;
  }
</style>
