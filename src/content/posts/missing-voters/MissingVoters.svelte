<script>
  import Scroller from '@sveltejs/svelte-scroller';
  import { csvParse } from 'd3';
  import BubbleChart from './components/BubbleChart.svelte';
  import Footnote from './components/Footnote.svelte';
  import PopulationPyramid from './components/PopulationPyramid.svelte';
  import BrexitLineChart from './components/BrexitLineChart.svelte';
  import HeaderPassports from './components/HeaderPassports.svelte';
  import csvRaw from './data/voting_age_population.csv?raw';
  import imgMalta from './img/header/malta.png';
  import imgCroatia from './img/header/croatia.png';
  import imgCzechia from './img/header/czechia.png';

  const data = csvParse(csvRaw);

  let index = 0;
  let offset = 0;
  let progress = 0;
  let count;

  let chartContainer;
  let chartWidth = 600;
  let chartHeight = 500;

  function updateDimensions() {
    if (chartContainer) {
      const rect = chartContainer.getBoundingClientRect();
      chartWidth = Math.min(rect.width - 40, 900);
      const w = window.innerWidth;
      const isMobile = w <= 768;
      const isTablet = w > 768 && w <= 1024;
      chartHeight = isMobile
        ? Math.min(Math.max(chartWidth * 1.5, 600), 1000, window.innerHeight * 0.55)
        : isTablet
          ? Math.min(Math.max(chartWidth * 0.9, 500), 700)
          : Math.min(Math.max(chartWidth * 0.65, 350), 550);
    }
  }

  $: if (chartContainer) {
    updateDimensions();
  }

  const steps = [
    {
      text: `<i>Bubble size</i> shows <span style="color: #d45d5d; font-weight: 700;">total adult population</span>. The <i>vertical axis</i> shows the <span style="color: #d45d5d; font-weight: 700;">number</span> of adult mobile Europeans; the <i>horizontal axis</i> shows their <span style="color: #d45d5d; font-weight: 700;">share</span> in the population.`,
    },
    {
      text: 'A whopping <span style="color: #d45d5d; font-weight: 700;">37%</span> of adults living in <span style="color: #d45d5d; font-weight: 700;">Luxembourg</span> are mobile Europeans, most notably from Portugal due to a history of guest workers in the 70ies.',
    },
    {
      text: '<span style="color: #d45d5d; font-weight: 700;">Germany</span> has the largest total amount of adult mobile Europeans: <span style="color: #d45d5d; font-weight: 700;">3.7 million</span>, <span style="color: #d45d5d; font-weight: 700;">5.4%</span> of the population.',
    },
    {
      text: '<span style="color: #d45d5d; font-weight: 700;">Spain, Italy</span> and <span style="color: #d45d5d; font-weight: 700;">France</span> also host a large population of other EU citizens. Combined a bit more than Germany.',
    },
    {
      text: 'A significant proportion of adults in <span style="color: #d45d5d; font-weight: 700;">Netherlands, Denmark, Austria, Belgium, Ireland, Malta</span> and <span style="color: #d45d5d; font-weight: 700;">Cyprus</span> are from other EU countries.',
    },
    {
      text: 'In these countries the fewest mobile Europeans live, but it still amounts to nearly <span style="color: #d45d5d; font-weight: 700;">950 thousand</span>.',
    },
  ];
</script>

<svelte:window on:resize={updateDimensions} />

<div class="mv-root">
  <header>
    <HeaderPassports />
    <div class="header-content">
      <p class="kicker">Data essay</p>
      <h1>The Missing Voters</h1>
      <p class="subtitle">
        11.8 million EU citizens pay taxes to governments they cannot vote for.
      </p>
      <p class="byline">by <a target="_blank" href="https://homolova.sk/hello">Ada Homolova</a> · 8 February 2026</p>
      <div class="scroll-hint">
        <span>Scroll to explore</span>
        <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
          <path d="M10 4 L10 18 M4 14 L10 20 L16 14" stroke="#999" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </header>

  <section class="prose">
    <p>I left Slovakia at 19, nearly half my life ago. I studied in Czechia, then moved to the Netherlands on an Erasmus stipend and stayed for over a decade. Got my master's, built a career, made friends. Two years ago I have moved again, to be closer to nature in the mountains of Tyrol.</p>
    <p>I could do this, because I was lucky I was born into an Europe that is united. Our Single Market stands on four freedoms: the free movement of <i>people, goods, services</i> and <i>capital</i>. It is seen as <a target="_blank" href="https://ec.europa.eu/commission/presscorner/detail/en/ip_18_6490">Europe's best asset</a> by the commission itself, and also by the people: nearly three quarters of <a target="_blank" href="https://europa.eu/eurobarometer/surveys/detail/3378">EU citizens say</a> that their country has benefited from being a member of the EU. </p>
    <p>However, some of its democratic structures have not kept pace with the increased mobility. One of them is the right to vote wherever you pay taxes. During my 13 years in The Netherlands I experienced four general elections. I could not vote in any of them.<Footnote number={1} text="As an immigrant, I could only vote for the municipal and water council elections." /></p>
    <p>I am not alone.</p>
  </section>
    <img class="divider-img" src={imgMalta} alt="Maltese passport">

  

  <Scroller
    top={0.0}
    bottom={0.8}
    threshold={0.5}
    bind:index
    bind:offset
    bind:progress
    bind:count
  >
    <div class="background" slot="background">
      <div class="chart-wrapper" bind:this={chartContainer}>
        <BubbleChart
          {data}
          step={index}
          stepOffset={offset}
          width={chartWidth}
          height={chartHeight}
        />
      </div>
    </div>

    <div class="foreground" slot="foreground">
      {#each steps as stepData, i}
        <section class="step" class:active={index === i} class:first-step={i === 0}>
          <div class="step-content">
            <p>{@html stepData.text}</p>
          </div>
        </section>
      {/each}
    </div>
  </Scroller>

  <div class="post-scroller">
   <details class="methodology">
        <summary>Methodological note</summary>
        <p>Eurostat publishes data in age groups. There is no 18+ age group, therefore the age group Y15-19 is partially counted, assuming uniform distribution, 2/5 of this group are 18-19 years old. Y20-24 and above are fully counted.</p>
  </details>

  <section class="prose">
    <h2>No way around it</h2>
    <p>On the day of the 2021 parliamentary elections, my friend gave me his voting slip, so I could vote on his behalf <Footnote number={2} text="The Dutch system allows to transfer your vote to another person." />. But at the polling station my Slovak passport was not accepted.</p>
    <p>It was not only that I could not vote in Dutch general elections. Over the years, spending most of my time with Dutch people, I became increasingly immersed in the daily news and issues of Dutch society, gradually losing touch with what was happening in Slovakia. As a result, I also repeatedly missed the deadlines to apply for postal votes in Slovakia.</p>
    <p>In the end, I ended up not voting for any national government anywhere for years. There is no comprehensive data on this, but <a target="_blank" href="https://www.sciencedirect.com/science/article/abs/pii/S0740624X20303397">some research</a> and <a target="_blank" href="https://globalcit.eu/international-ideas-new-research-into-out-of-country-voting-practices-the-use-of-technology-and-voter-turnout/">survey data</a> suggest that this is a structural problem among expats.</p>
</section>
    <img class="divider-img" src={imgCroatia} alt="Croatian passport">
 <section class="prose">
    <h2>It gets worse</h2>
    <p>One fine morning my partner and I went to the town hall to find out how we could vote in the then upcoming EU elections. We had only recently moved to Austria and were still navigating its complex bureaucracy.</p>
    <p>It turned out that we had to ask to be entered into the voting register and submit a formal declaration. This was about 3 months earlier. The alternative was that we both travel to our own countries of citizenship on the election day to vote there. We did not vote.</p>
    <p>This is how inconsistent rules in the EU keep out it's most allied voters. A <a target="_blank" href="https://osf.io/preprints/socarxiv/6rxdp_v2">German study found</a> that despite strong attachment to the European Union, mobile Europeans are less likely to participate in European elections. This is because each member state has different procedures, deadlines, and often inadequate public information.</p>

    <p>This might sound like I don't care about casting my vote, but I actually do. I would love to vote. Yet in practice I don't. And it seems to be a structural problem.</p>
    <p>What is more, mobile Europeans are, on average, younger than the native population. Millions of younger voters are therefore probably missing from the ballots.</p>
  </section>

  <section class="prose">
    <h2>Mobile Europeans are, on average, younger than the native population</h2>
    <PopulationPyramid />
  </section>

  <section class="prose">
  <p>I am not the first to flag this issue. In 2020 a citizens initiative <a target="_blank" href="https://citizens-initiative.europa.eu/initiatives/details/2020/000002_en"><i>Voters without Borders</i></a> collected signatures for the European Commission to let EU citizens vote where they live, for all elections and referendums. They also called the commission to explore extending voting rights to non-EU residents.</p>
  <p>Even as the initiative ultimately failed<Footnote number={3} text='<a href="https://citizens-initiative.europa.eu/_en#" target=_blank>Citizens initiatives</a> have to collect a million signatures to be successful and get answer from the Commission. 80% of the all the past 126 initiatives have failed, and only 8% got answered by the Commission.' />, the Commission did in the end start a process to update the rules slightly, so mobile Europeans can more easily learn about their right to vote and even run in European Parliament elections. The process has finalized last year and the member states now have two years to implement it in their national legislation. <Footnote number={4} text='Fun fact: The EU is a slowpoke, so the whole process took them <i>only</i> four years. Here are <a href="https://www.europarl.europa.eu/legislative-train/spotlight-JD%2023-24/file-voting-rights-of-eu-citizens-residing-in-other-member-states" target="_blank">all the juicy details</a> of this process for the connoisseurs.'/></p>
  <p>However, this is not enough. The European Union often feels distant from the everyday lives of many of its citizens. But we do have elected representatives in the European Parliament and we should put them to work. MEPs <a href="https://www.europarl.europa.eu/meps/en/197426/SVEN_SIMON/home">Sven Simon</a> and <a href="https://www.europarl.europa.eu/meps/en/257053/ANA+CATARINA_MENDES/home">Ana Catarina Mendes</a> were responsible for the <a href="https://www.europarl.europa.eu/legislative-train/spotlight-JD%2023-24/file-voting-rights-of-eu-citizens-residing-in-other-member-states">recent legislative changes</a> described above. How about we <a href="mailto:anacatarina.mendes@europarl.europa.eu,sven.simon@europarl.europa.eu?subject=Mobile%20EU%20citizens%20should%20be%20allowed%20to%20vote%20in%20national%20elections%20in%20their%20country%20of%20residence">tell them</a> that these measures do not go far enough?</p>

  </section>

  <section class="prose">
  <h2>Why does this matter?</h2>
  <p>As the EU counts over 366 million eligible voters, 11.8 million, or 3.3% may seem a small number. But is it?</p>
  <p>Remember Brexit? What made the difference was just 3.7% of the votes <Footnote number={5} text="The difference between remain and leave were 1.3 million votes out of 33.6 million" />. Today, more than half of Britons think that leaving was a mistake.</p>

  <h2>Less and less Britons believe leaving the EU was a good idea</h2>
  <BrexitLineChart />
  
  <p>These are weird times. The USA grows more unpredictable by the day and our governments are tilting rightwards, with growing Euroscepticism. Far-right parties now hold a quarter of the seats in the European Parliament, a historic high.</p>
  <p>We should not take our united Europe for granted. The Single Market was never just an economic project, but a political union as well. Yet today, millions of citizens who live, work, and pay taxes in EU countries other than those of their birth remain structurally excluded from full participation in the political life of the places they call home. This despite that the <a target="_blank" href="https://www.europarl.europa.eu/cmsdata/214271/Eurobarometer%20Report_%20EU%20Citizenship%20&%20Democracy%20-%20July%202020.pdf">majority of EU citizens agree</a> that citizens living in another EU country should have the right to vote in national elections there.</p>
  <p>If Europe is to withstand rising populism and Euroscepticism, we must strengthen its democratic foundations. Allowing people to vote where they live would be a good start.</p>
  </section>

  <img class="divider-img" src={imgCzechia} alt="Czech passport">

  <section class="prose">
  <h2>Afterword</h2>
  <p>I have written about mobile Europeans because this is the reality I know best. But it is important to note that we are still the most privileged foreigners in Europe.</p>
  <p>Non-EU citizens, stateless people, asylum seekers and undocumented immigrants live in the EU with even more limited political rights.</p>
  </section>

  <section class="thanks">
    <p>Thanks to my early readers Lenka, Guillaume, Jonathan, Rodrigo, James and Johan for their time and valuable feedback.</p>
  </section>

  </div>
</div>

<style>
  .mv-root {
    width: 100%;
    overflow-x: hidden;
    background: #fafaf8;
    padding-bottom: 4rem;
  }

  header {
    position: relative;
    min-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .header-content {
    position: relative;
    z-index: 1;
    max-width: 640px;
    text-align: center;
    background: rgba(250, 250, 248, 0.92);
    padding: 2.5rem 3rem;
    border-radius: 8px;
  }

  .kicker {
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-size: 0.75rem;
    font-weight: 600;
    color: #999;
    margin-bottom: 1rem;
  }

  h1, h2, h4 {
    font-family: 'DM Serif Text', serif;
  }

  h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 700;
    line-height: 1.1;
    color: #1a1a2e;
    margin-bottom: 1.25rem;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: #555;
    line-height: 1.6;
    max-width: 520px;
    margin: 0 auto 2rem;
  }

  .byline {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 2rem;
  }

  .scroll-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #999;
    font-size: 0.8rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .background {
    width: 100%;
    height: 100vh;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .chart-wrapper {
    width: 65%;
    max-width: 960px;
    padding: 1rem 4rem 1rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .foreground {
    position: relative;
    pointer-events: none;
  }

  .step {
    height: 80vh;
    display: flex;
    align-items: center;
    padding-left: 3vw;
    pointer-events: none;
  }

  .step-content {
    max-width: 340px;
    background: rgba(250, 250, 248, 0.92);
    border-left: 3px solid #ddd;
    padding: 1.5rem 1.75rem;
    border-radius: 0 6px 6px 0;
    backdrop-filter: blur(4px);
    transition: border-color 0.4s ease;
    pointer-events: auto;
  }

  .step.active .step-content {
    border-left-color: #d45d5d;
  }

  .step-content p {
    font-size: clamp(0.95rem, 1.5vw, 1.15rem);
    line-height: 1.65;
    color: #2a2a3e;
    margin: 0;
  }

  .prose {
    max-width: 640px;
    margin: 0 auto;
    padding: 1.5rem 2rem;
    position: relative;
    z-index: 2;
    background: #fafaf8;
  }

  .prose p {
    font-size: clamp(1rem, 2vw, 1.2rem);
    line-height: 1.75;
    color: #2a2a3e;
    margin-bottom: 1.25rem;
  }

  .divider-img {
    display: block;
    max-height: 150px;
    width: auto;
    margin: 0.5rem auto;
    transform: rotate(-3deg);
  }


  .post-scroller {
    position: relative;
    z-index: 2;
    background: #fafaf8;
  }

  .methodology {
    max-width: calc(640px - 4rem);
    margin: 2rem auto;
    padding: 0.75rem 1.5rem;
    background: #f0f0ed;
    border-radius: 8px;
    font-size: 0.85rem;
    color: #555;
    line-height: 1.6;
  }

  .methodology summary {
    font-family: 'DM Serif Text', serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.5rem 0;
  }

  .methodology summary::-webkit-details-marker {
    margin-right: 0.5rem;
  }

  .methodology[open] summary {
    margin-bottom: 0.5rem;
  }

  .methodology p {
    margin: 0 0 0.5rem 0;
  }

  .read-more {
    max-width: 640px;
    margin: 2rem auto;
    padding: 0 2rem;
  }

  .read-more h4 {
    font-size: 1rem;
    color: #555;
    margin-bottom: 1rem;
  }

  .read-more-links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .read-more-card {
    padding: 1rem 1.25rem;
    background: #f5f5f2;
    border-radius: 8px;
    text-decoration: none;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .read-more-card:hover {
    background: #eaeae6;
    transform: translateY(-2px);
  }

  .read-more-title {
    display: block;
    font-weight: 600;
    color: #d45d5d;
    margin-bottom: 0.25rem;
  }

  .read-more-desc {
    display: block;
    font-size: 0.85rem;
    color: #666;
    line-height: 1.4;
  }

  .buttons-section {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin: 2rem auto;
    max-width: 640px;
    padding: 0 2rem;
    flex-wrap: wrap;
  }

  .subscribe-btn,
  .donate-btn,
  .linkedin-btn {
    display: inline-block;
    padding: 0.8rem 1.8rem;
    border-radius: 6px;
    color: #fff;
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 600;
    transition: background 0.2s ease;
  }

  .subscribe-btn {
    background: #d45d5d;
  }

  .subscribe-btn:hover {
    background: #b94d4d;
  }

  .linkedin-btn {
    background: #0a66c2;
  }

  .linkedin-btn:hover {
    background: #004182;
  }

  .donate-btn {
    background: #888;
  }

  .donate-btn:hover {
    background: #6e6e6e;
  }

  .share-section {
    max-width: 640px;
    margin: 1.5rem auto;
    padding: 0 2rem;
    text-align: left;
  }

  .share-section p {
    font-size: clamp(1rem, 2vw, 1.2rem);
    color: #2a2a3e;
    margin-bottom: 0.75rem;
    display: inline;
    margin-right: 0.5rem;
  }

  .copy-btn {
    display: inline-block;
    padding: 0.5rem 1.2rem;
    border-radius: 5px;
    font-size: 0.9rem;
    font-weight: 500;
    background: #d45d5d;
    color: #fff;
    border: none;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s ease;
  }

  .copy-btn:hover {
    background: #b94d4d;
  }

  .thanks {
    max-width: 640px;
    margin: 2rem auto;
    padding: 0 2rem;
  }

  .thanks p {
    font-size: 0.85rem;
    color: #888;
    font-style: italic;
    line-height: 1.6;
  }

  .about-ada {
    max-width: 640px;
    margin: 2rem auto;
    padding: 0 2rem;
  }

  .about-ada h4 {
    font-size: 1rem;
    color: #555;
    margin-bottom: 0.75rem;
  }

  .about-ada p {
    font-size: 0.9rem;
    color: #666;
    line-height: 1.65;
  }

  footer {
    padding: 4rem 2rem;
    text-align: center;
    border-top: 1px solid #eee;
    margin-top: 4rem;
  }

  .footer-content p {
    font-size: 0.85rem;
    color: #999;
  }

  @media (max-width: 768px) {
    .background {
      flex-direction: column;
      justify-content: flex-end;
    }

    .chart-wrapper {
      width: 100%;
      padding: 1rem;
      margin-top: auto;
    }

    .step {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .step-content {
      max-width: 100%;
      background: rgba(250, 250, 248, 0.95);
    }

    .first-step .step-content {
      display: none;
    }
  }
</style>
