<script>
  import { onMount } from 'svelte';
  import './palette.css';
  import Placeholder from './components/Placeholder.svelte';
  import Divider from './components/Divider.svelte';
  import ProteinPriceBarcode from './components/ProteinPriceBarcode.svelte';
  import FertilizerArea from './components/FertilizerArea.svelte';
  import EmissionsBars from './components/EmissionsBars.svelte';
  import EmissionsMarimekko from './components/EmissionsMarimekko.svelte';
  import LandWaterMultiples from './components/LandWaterMultiples.svelte';
  import LivewellPlates from './components/LivewellPlates.svelte';
  import BeanSizes from './components/BeanSizes.svelte';
  import Recipes from './components/Recipes.svelte';

  // Parallax: every [data-parallax] element gets translateY(scrollY * rate).
  // Writing into a CSS var so the rotate transform on the same element survives.
  onMount(() => {
    const targets = Array.from(
      document.querySelectorAll('[data-parallax]'),
    ).map((el) => ({ el, rate: parseFloat(el.dataset.parallax ?? '0') }));
    if (!targets.length) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        for (const { el, rate } of targets) {
          el.style.setProperty('--py', `${y * rate}px`);
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Cherry+Bomb+One&family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap"
  />
</svelte:head>

<div class="beans-root">
  <article>
    <header class="hero">
      <div class="hero-notes" aria-hidden="true">
        <img class="note note--1" src="/images/cover/notes/mung-note.png"       alt="" data-parallax="0.08"  />
        <img class="note note--2" src="/images/cover/notes/adzuki-note.png"     alt="" data-parallax="-0.05" />
        <img class="note note--3" src="/images/cover/notes/black-bean-note.png" alt="" data-parallax="0.12"  />
        <img class="note note--4" src="/images/cover/notes/fava-note.png"       alt="" data-parallax="-0.10" />
        <img class="note note--5" src="/images/cover/notes/borlotti-note.png"   alt="" data-parallax="0.15"  />
        <img class="note note--6" src="/images/cover/notes/kidney-note.png"     alt="" data-parallax="-0.08" />
        <img class="note note--7" src="/images/cover/notes/chickpea-note.png"   alt="" data-parallax="0.10"  />
      </div>
      <div class="hero-content">
        <p class="kicker">Data essay</p>
        <h1>An ode to beans</h1>
        <p class="dek">Even small seeds can reshape large systems.</p>
        <p class="byline">by <a href="/hello">Ada Homolova</a> · 15 May 2026</p>
        <p class="scroll-hint"><span>Scroll</span><span class="scroll-arrow" aria-hidden="true">↓</span></p>
      </div>
    </header>

    <section class="prose">
      <p>
        A single plant family can simultaneously reduce emissions, improve soil health and
        provide some of the cheapest protein available. It's legumes! Roughly one quarter protein and one quarter carbohydrates,
        rich in fiber and low in fat, they become complete proteins when paired with grains such as rice or wheat.
      </p>
      <p>
        Growing up on sour lentil stews and rich bean soups, this essay is born from
        affection for all that is beans, lentils, peas, chickpeas: lovely, fragrant, nutty,
        earthy, satisfying.
      </p>
      <p>However, it is also rooted in unease.</p>
      <p>
        As our societies grow wealthier, we consume
        <a
          href="https://www.oecd.org/en/about/news/press-releases/2025/07/emerging-economies-expected-to-drive-growth-in-animal-source-food-consumption-and-production-over-the-coming-decade-according-to-oecd-fao-agricultural-outlook-2025-2034.html"
          target="_blank"
          rel="noopener"
        >more and more animal products</a>, even as the environmental consequences of
        industrial livestock farming become harder to ignore. Our current food production eats deeply
        into our carbon budget, diminishes water and soil health and reduces forests coverage. Animals are pushed through systems
        designed primarily for efficiency and scale. All of this puts our future food
        security in danger.
      </p>
      <p>
        Yet despite this, the European agricultural policy directs <a href="https://foodrise.org.uk/CAPCrossroads/" target="_blank">three times more
        subsidies</a> to the production of animal-sourced foods than to plant-based foods.
        Millions of taxpayers money are being poured into green-washing
        <a
          href="https://www.desmog.com/2025/11/25/meps-call-for-review-eu-food-scheme-misleading-claims/"
          target="_blank"
          rel="noopener"
        >campaigns of meat and dairy</a>. Governments speak about sustainability while
        continuing to subsidise systems that intensify emissions and lock
        farmers into fertiliser dependence.
      </p>
      <p>
        This essay is a pocket reference of data-driven evidence for everybody who suspects
        that the way we currently produce and consume food cannot continue indefinitely.
      </p>
      <p>
        It is also a guide: for the curious and the unsure, who find it scary or difficult
        to incorporate legumes into their diet.
      </p>
    </section>

    <Divider beans={['adzuki', 'green-lentils', 'fava']} />

    <section class="chapter"><h2>The nature of agriculture</h2></section>

    <section class="prose">
      <p>
        The past hundred years saw a staggering intensification of food production. We now
        have more food than ever, are more overweight than ever, and also throw away more
        food than ever. The system that made this possible however, is not sustainable.
      </p>
      <p>
        Food production is responsible for roughly a
        <a
          href="https://ourworldindata.org/greenhouse-gas-emissions-food"
          target="_blank"
          rel="noopener"
        >quarter to a third</a> of global emissions. This is a huge amount and possibly
        rightfully so: everybody needs to eat. But not all foods are equal.
      </p>
      <p>
        Agricultural emissions come from growing plants, keeping animals, transport
        and packaging. Out of these, transport and packaging are the smaller part.
        It is therefore way more important what you eat than where it came from. Even if the food from the local farmers market will probably taste
        better.
      </p>
    </section>

    <figure class="chart-block">
      <EmissionsMarimekko />
    </figure>

    <section class="prose">
      <p>
        Why are animal products so intensive? Partly because animals don't produce
        protein so much as convert it: large quantities of soy, grain, water and land
        are required to produce comparatively small amounts of meat, milk or eggs. Every
        step in that chain consumes energy.
      </p>
    </section>

    <figure class="chart-block">
      <EmissionsBars />
    </figure>

    <section class="prose">
      <p>
        In terms of greenhouse gases it's methane from cow burps. These alone account for
        roughly 33 to 43% of agricultural emissions. Then there is CO₂ released from the
        deforestation for pasture and feed crops, and the nitrous oxide from synthetic
        fertilisers.
      </p>
      <p>
        Modern agriculture depends heavily on nitrogen fertiliser.
        Producing it is highly energy-intensive and accounts for roughly <a href="https://www.nature.com/articles/s41598-022-18773-w" target="_blank">2% global emissions</a>, about the same as the aviation industry.
        And our fertilizer dependence is growing.
      </p>
    </section>

    <figure class="chart-block">
      <FertilizerArea />
    </figure>

    <section class="prose">
      <p>
        This has some real consequences. We experienced food prices go up when the fertilizer trade was disrupted after the invasion of Ukraine.
        And now the scenario is repeating in the Strait of Hormuz debacle.
      </p>
      <p>So how could the world look like if we swap some of our protein sources?</p>
    </section>

    <section class="chapter"><h2>Jack and the Beanstalk</h2></section>

    <section class="prose">
      <p>
        In the fairy tale, Jack trades the family cow for a handful of beans. It looks like
        a terrible bargain. The cow is tangible wealth, but the beans are ... well just some beans.
      </p>
      <p>
        Modern agriculture made a similar trade. Over the past century, farming
        systems gradually exchanged diversity, soil fertility and resilient local crops for
        industrial livestock production, synthetic fertilisers and scale.
      </p>
      <p>
        At first, the bargain made sense. Food became cheaper. Meat became
        abundant. We could feed more people. But eventually, the giant appeared. At the top of the
        beanstalk we now find emissions, deforestation, polluted waterways, exhausted soils and
        dependence on fossil-fuel-intensive fertilisers.
      </p>
      <p>
        Jack trading a cow for beans sounded ridiculous. But now it might be one of the
        best trades we can make. Beans namely are truly a magical plant. Thanks to a
        symbiosis with soil bacteria, legumes fix nitrogen directly from the air, meaning
        they actually fertilize themselves and the soil around them — from thin air!
      </p>
      <p>
        That places legumes among the so-called low-input crops: plants that meet most of their own nutritional
        and protective needs without requiring heavy human intervention. Replacing even
        a portion of animal protein with legumes would not simply change what ends up on
        our plates. It would reshape agriculture itself.
      </p>
      <p>
        While synthetic fertilizers force productivity into the soil from the outside,
        legumes regenerate fertility from within. Farmers have used beans and peas in crop
        rotations for centuries because they naturally restore nitrogen to depleted fields.
      </p>
      <p>
        They would also change the land use. Today, <a href="https://fefac.eu/newsroom/news/a-few-facts-about-livestock-and-land-use/" target="_blank">40% of arable land</a> is used to feed livestock
        rather than humans. Every step in this
        chain consumes energy, fertilizer, water and land. Legumes on the other hand
        provide protein directly.
      </p>
    </section>

    <figure class="chart-block">
      <LandWaterMultiples />
    </figure>

    <section class="prose">
      <p>
        If humans ate more protein directly from legumes, enormous areas of land could be freed.
        <a href="https://www.nature.com/articles/s41467-023-40899-2" target="_blank">Replacing even half of the world's main animal products</a> (pork, chicken, beef and milk) with plant-based alternatives
        would not only cut agriculture's greenhouse gas emissions by nearly a third by 2050,
        but also almost entirely halt the loss of forests and natural land. We could turn land to forests, wetlands and grasslands, allowing ecosystems to recover and carbon to be stored
        again in <a href="https://www.reuters.com/graphics/GLOBAL-ENVIRONMENT/INSECT-APOCALYPSE/egpbykdxjvq/" target="_blank">landscapes that are full of life</a>.
      </p>
      <p>
        This matters even more in a world shaped by climate instability and geopolitical
        shocks. Modern agriculture depends heavily on fossil fuels, mined nutrients and
        global fertilizer trade. Legumes, by contrast remain comparatively resilient when
        these systems fail or become expensive.
      </p>
      <p>And they do all this while remaining one of the cheapest protein sources available.</p>
    </section>

    <figure class="chart-block">
      <ProteinPriceBarcode />
    </figure>

    <section class="prose">
      <p>
        Perhaps the fairy tale had it backwards all along. The true magic was never the
        giant in the clouds, but the tiny beans in the soil.
      </p>
    </section>

    <section class="chapter"><h2>A sustainable diet</h2></section>

    <section class="prose">
      <p>
        Take this paradox: while many countries have enough land to satisfy a home-grown
        diet, no country can currently feed its entire population
        <a
          href="https://www.not-ship.com/self-sufficiency-food/"
          target="_blank"
          rel="noopener"
        >through domestic production alone</a>. Keeping and feeding cattle takes a lot of
        space on our limited planet.
      </p>
      <p>But a more bean-rich future would not necessarily mean giving things up.</p>
      <p>
        Beans are not an obscure substitute food, quite the opposite. Many of the world's
        great culinary traditions are already centered around legumes: lentil stews,
        chickpea curries, lentil dahl, tofu, hummus, black beans with rice and countless
        regional dishes developed long before industrial agriculture existed.
      </p>
      <p>
        And despite what our current average diets suggest, healthy eating does not require the
        quantities of animal protein consumed in wealthy countries today.
      </p>
    </section>

    <figure class="chart-block">
      <LivewellPlates />
    </figure>

    <section class="prose">
      <p>
        It's not that meat or dairy must disappear completely. The issue is scale. Eight
        billion people cannot sustainably eat resource-intensive food every day.
      </p>
      <p>
        But all of the above is a bit abstract until we talk about practice.
        And none of this works if eating beans makes you miserable. And for some time, they made me quite miserable.
      </p>
    </section>

    <section class="chapter"><h2>Beans and you 💚</h2></section>

    <section class="prose">
      <p>
        Bloating and gas are a common side effect of eating legumes.
        But it doesn’t have to be a struggle, if the transition happens gradually.
      </p>
      <p>
        Some years ago I was diagnosed with Irritable Bowel Syndrome and beans were my
        biggest trigger. For someone who grew up on bean soup and lentil stew, this was a
        bitter pill to swallow. But if eating beans meant waking up at night with severe
        abdominal pain, I'd rather give them up.
      </p>
      <p>
        Not every digestive system is the same, and what works for me will not work for everybody.
        But many people who struggle with legumes
        benefit from the same principle: start smaller and slower than you think you need
        to.
      </p>
      <p>
        The first and most important rule: size matters. Both
        size of the bean as well as size of the portion. The bigger the bean, the more
        difficult it is to disintegrate by cooking. This means more physically trapped
        nutrients arrive to the colon and ferment there causing gas. On top of
        that, hulled beans are more difficult to digest than split ones, following similar
        logic: the hull disintegrates less well in cooking and ferments.
      </p>
      <p>
        Notice that many of the beans usually shelved in our supermarkets, kidney beans,
        black beans, or chickpeas, usually come from the large end of the spectrum.
      </p>
    </section>

    <BeanSizes />

    <section class="prose">
      <p>
        Then there is the size of a portion. I would cook meals where lentils were the
        main ingredient. I don't do that anymore. They currently make up maybe a handful
        on my plate, sometimes less. Especially if you are not used to eating legumes, you
        need to give time to your gut microbiome adjust. You need to start slow. This
        process may take months, so don't rush it.
      </p>
      <p>
      Soak legumes well before cooking. Much of the bloating they cause comes from carbohydrates called oligosaccharides,
      which will partially leach into the soaking water. The smaller the legume, the less important soaking becomes.
      Moong dal or red lentils don't need to be soaked. Beluga, du Puy, and green lentils, as well as mung beans,
      adzuki beans, and cowpeas, can also be cooked without soaking if your digestion tolerates them well.
      Still, I often give them a quick soak: pour boiling water over them and let them sit for about an hour.
      Larger beans generally benefit from a full 8-hour soak before cooking. I don't eat those that much though.
      </p>
      <p>
        And finally, use spices. From the Indian cuisine: ginger, turmeric, cumin, fennel
        and asafoetida are beneficial. From the Japanese seaweed such as kombu, or from
        the European we know the 'bean herb', mountain savory. While kombu and asafoetida
        prevent fermentation, ginger, fennel, cumin, and savory relax the gut and
        stimulate digestive enzymes.
      </p>
    </section>

    <Divider />

    <section class="prose">
      <p>
        To eat more plant-based, you don't need a dramatic lifestyle change. You don't
        need expensive "meat replacements" either. Beans, lentils, tofu, and tempeh are
        already enough.
      </p>
      <p>
        What matters more is starting small and keeping at it. Start with one or two bean meals a week. Cook lentils on Monday. Try a legume
        you've never had before: adzuki beans, mung dal, beluga lentils. Try tofu or tempeh. None of
        this requires giving up animal products completely.
      </p>
      <p>
        It may seem insignificant, but food companies and supermarkets pay close attention to what
        people buy. Consumer habits shape what gets produced, promoted, and made
        affordable.
      </p>
      <p>
        Policy matters too. Governments decide what is subsidised, what farmers are
        encouraged to grow, and what ends up on school trays and supermarket shelves.
        Right now, the animal-based food lobby has the upper hand: this year, EU has
        <a
          href="https://proveg.org/article/eu-agrees-new-rules-on-plant-based-food-names-but-veggie-burgers-remain-safe/"
          target="_blank"
          rel="noopener"
        >banned meat names for plant-based foods</a>. We are in need of agricultural
        policies that support plant proteins, and put plant-based food at the
        <a
          href="https://www.euroveg.eu/wp-content/uploads/2023/10/Plant-Based-Sustainable-Public-Procurement-EVU-report-1.pdf"
          target="_blank"
          rel="noopener"
        >center of public procurement</a>.
      </p>
      <p>
        The future we can create is not one of joyless substitutes or dry salads. It's a
        future where soil is healthier, food is cheaper and more secure, and animals are
        treated with more care. Where meat and cheese can still have a place, but everyday
        meals might look more like a warm bowl of lentil stew with rice.
      </p>
      <p>
        And with that in mind, here are three recipes to get you started.
        <em>Bon appétit!</em>
      </p>
    </section>

    <Recipes />

  </article>
</div>

<style>
  /* ============================================================
     Fonts and base typography scoped to .beans-root.

     Custom properties cascade by inheritance: defining --sans here
     overrides the site-wide --sans (Roboto) for everything inside
     this subtree, including child components that read var(--sans).
     ============================================================ */
  .beans-root {
    --sans: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
    --serif: 'Source Serif 4', Georgia, 'Times New Roman', serif;
    --headline: 'Fraunces', 'Source Serif 4', Georgia, serif;

    font-family: var(--sans);
    font-size: 18px;
    line-height: 1.55;
    color: var(--text-on-light);
    background: var(--surface-parchment);
    /* padding-bottom traps the final child's margin-bottom inside .beans-root
       so the parchment bg extends all the way to the footer (otherwise the
       margin collapses out and the body's white bg shows through). */
    padding-bottom: 1px;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Body element styles — :global so they reach chart-component descendants. */
  .beans-root :global(h1),
  .beans-root :global(h2),
  .beans-root :global(h3) {
    font-family: var(--serif);
    font-weight: 600;
    color: var(--text-on-light);
    letter-spacing: -0.01em;
  }
  .beans-root :global(h1) {
    font-size: clamp(2.25rem, 5vw, 3.75rem);
    line-height: 1.1;
    margin: 0 0 1.5rem;
  }
  .beans-root :global(h2) {
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    line-height: 1.2;
    margin: 0 0 1rem;
  }
  .beans-root :global(p) {
    font-family: var(--serif);
    font-size: 1.15rem;
    line-height: 1.65;
    margin: 0 0 1.25rem;
  }
  .beans-root :global(a) {
    color: var(--color-kidney);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .beans-root :global(a:hover) {
    color: var(--color-coral-lentil);
  }

  /* Chart frame — applies to figures rendered by chart child components. */
  .beans-root :global(.chart-block) {
    max-width: 900px;
    margin: 3rem auto;
    padding: 0 1.5rem;
  }

  /* Chart caption styles — shared across all chart components. */
  .beans-root :global(.chart .cap) {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1.25rem;
  }
  .beans-root :global(.chart .title) {
    order: 1;
    font-family: var(--headline);
    font-weight: 700;
    font-size: 1.5rem;
    line-height: 1.2;
    letter-spacing: -0.01em;
    color: var(--text-on-light);
  }
  .beans-root :global(.chart .subtitle) {
    order: 2;
    font-family: var(--sans);
    font-size: 0.75rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-kidney);
  }
  .beans-root :global(.chart .source) {
    font-family: var(--sans);
    font-size: 0.75rem;
    color: var(--text-on-light-muted);
    margin: 0.75rem 0 0;
  }
  .beans-root :global(.chart .source a) {
    color: var(--color-kidney);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .beans-root :global(.chart .source a:hover) {
    color: var(--color-coral-lentil);
  }

  /* ============================================================
     Article-local layout — hero, prose, chapter
     ============================================================ */
  article {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
  }

  .hero {
    position: relative;
    width: 100%;
    min-height: 90vh;
    margin: 0;
    padding: 6rem 1.5rem 3vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    /* overflow visible lets parallax notes drift past the hero edge.
       isolation makes the hero its own stacking-context atom, so the
       prose section (which follows in the DOM) paints on top of any
       drifted notes without fragile z-index gymnastics. */
    overflow: visible;
    isolation: isolate;
  }
  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 720px;
    width: 100%;
  }
  .hero :global(h1) {
    font-family: 'Cherry Bomb One', var(--serif);
    font-weight: 400;
    font-size: clamp(2.75rem, 7.5vw, 5.25rem);
    line-height: 1;
    letter-spacing: 0;
    color: var(--text-on-light);
    margin: 0 0 1.25rem;
  }

  /* dancing notes — seven beans absolutely positioned around the title.
     Transform composes a parallax translateY (set by JS into --py) with each
     note's individual rotation (--rot). */
  .hero-notes {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }
  .note {
    position: absolute;
    display: block;
    height: auto;
    transform: translate3d(0, var(--py, 0), 0) rotate(var(--rot, 0deg));
    will-change: transform;
  }
  .note--1 { top: 8%;  left: 14%;  width: clamp(38px, 4vw, 58px);  --rot: -22deg; }
  .note--2 { bottom: 1rem; left: 49%; width: clamp(46px, 5vw, 72px);  --rot: 14deg; }
  .note--3 { top: 10%; right: 15%; width: clamp(36px, 3.8vw, 54px); --rot: -15deg; }
  .note--4 { top: 36%; left: 7%; width: clamp(60px, 6.5vw, 96px); --rot: 14deg; }
  .note--5 { top: 34%; right: 8%; width: clamp(48px, 5.5vw, 78px); --rot: -12deg; }
  .note--6 { top: 64%; left: 16%; width: clamp(52px, 5.8vw, 84px); --rot: -20deg; }
  .note--7 { top: 62%; right: 17%; width: clamp(40px, 4.5vw, 64px); --rot: 18deg; }

  @media (min-width: 1280px) {
    .note--1 { left: 20%; }
    .note--3 { right: 21%; }
    .note--4 { left: 12%; }
    .note--5 { right: 13%; }
    .note--6 { left: 22%; }
    .note--7 { right: 23%; }
  }

  @media (max-width: 760px) {
    .note--5, .note--6 { display: none; }
    .note--1 { top: 4%;  left: 4%;   width: clamp(28px, 7vw,    38px); }
    .note--2 { bottom: 1rem; left: 4%; width: clamp(20px, 5.5vw, 28px); }
    .note--3 { top: 5%;  right: 4%;  width: clamp(26px, 6.5vw,  34px); }
    .note--4 { top: 30%; left: 1%;   width: clamp(32px, 8vw,    44px); }
    .note--7 { top: 38%; right: 1%;  width: clamp(28px, 7vw,    38px); }
  }
  /* p.kicker / p.scroll-hint / p.dek all need element+class specificity
     to beat `.beans-root :global(p)` (0,2,1 once scoped). */
  p.kicker {
    font-family: var(--sans);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #999;
    margin: 0 0 2.5rem;
  }
  /* p.dek beats the broader `.beans-root :global(p)` rule's specificity,
     so font-size, margin: 0 auto (centering), and italic actually apply. */
  p.dek {
    font-family: var(--serif);
    font-size: clamp(1.25rem, 2vw, 1.55rem);
    font-style: italic;
    line-height: 1.45;
    color: var(--text-on-light);
    max-width: 32ch;
    margin: 0 auto;
  }
  p.byline {
    font-family: var(--sans);
    font-size: 0.9rem;
    color: #888;
    margin: 2.5rem 0 0;
  }
  p.byline :global(a) {
    color: inherit;
  }
  p.scroll-hint {
    font-family: var(--sans);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--text-on-light-muted);
    margin: 3.5rem 0 0;
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }
  .scroll-arrow {
    display: inline-block;
    animation: scroll-bob 1.8s ease-in-out infinite;
  }
  @keyframes scroll-bob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(4px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .scroll-arrow { animation: none; }
  }

  .prose {
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    /* Sit above any hero notes that overflowed into this section. */
    position: relative;
    z-index: 1;
  }

  .chapter {
    max-width: 640px;
    margin: 0 auto;
    padding: 6rem 1.5rem 1rem;
  }
  .chapter :global(h2) {
    font-family: 'Cherry Bomb One', var(--serif);
    font-weight: 400;
    font-size: clamp(2rem, 4.5vw, 3.25rem);
    line-height: 1.1;
    letter-spacing: 0;
    color: var(--text-on-light);
  }
</style>
