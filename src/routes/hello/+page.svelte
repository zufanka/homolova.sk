<script lang="ts">
  import { onMount } from 'svelte';

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
</script>

<svelte:head>
  <title>Hey it's Ada</title>
  <meta
    name="description"
    content="Ada Homolova — freelance data journalist. Own projects, teaching, and a chronological client history."
  />
</svelte:head>

<article class="hello">
  <header class="hello__hero">
    <h1>Ada Homolova</h1>
    <p class="hello__lede">
      I'm a freelance data journalist with over 10 years of experience in data
      &amp; investigative journalism, cross-border reporting, and teaching
      &amp; mentoring.
    </p>
    <p class="hello__contact">
      Wanna work with me? Get in touch via
      <a href={emailHref}>{emailDisplay}</a>.
    </p>
  </header>

  <section>
    <h2>🛠 Own projects</h2>

    <article class="role">
      <h3>🐸 Data Frosch</h3>
      <p>
        A learning platform focused on data journalism. Here I run my data
        <a href="https://datafrosch.fun/mentorship" target="_blank" rel="noopener">journalism mentorship program</a>
        and an online community by and for nerds in the newsroom called
        <a href="https://discord.gg/FQe2UQxE5D" target="_blank" rel="noopener">🪷The Pond🪷</a>.
      </p>
    </article>

    <article class="role">
      <h3>🕺 Elvis (map me tender)</h3>
      <p>
        I was the initiator and project leader of a data visualisation tool for public spending
        networks. We set out to visualise all the public spending in Europe as a graph. See how it
        worked in this <a href="https://www.youtube.com/watch?v=xsIUoBfdhEw" target="_blank" rel="noopener">YouTube video</a>,
        or have a look at the version we made for
        <a href="https://defence.tenders.exposed/" target="_blank" rel="noopener">defence tenders</a>
        (in collaboration with the
        <a href="https://www.govtransparency.eu" target="_blank" rel="noopener">Government Transparency Institute</a>).
      </p>
    </article>
  </section>

  <section>
    <h2>🎓 Teaching &amp; mentoring</h2>

    <article class="role">
      <h3>Dataharvest</h3>
      <p>
        💪 Since 2020 I have been the coordinator of the data skills training at the
        <a href="https://dataharvest.eu" target="_blank" rel="noopener">Dataharvest</a> conference.
      </p>
    </article>

    <article class="role">
      <h3>University of Gothenburg</h3>
      <p>
        🐍 Between 2020 and 2024 I was a guest lecturer on Python programming for master students of
        the Investigative Journalism (MIJ) program.
      </p>
    </article>

    <article class="role">
      <h3>IJ4EU</h3>
      <p>
        💪 Since 2022 I have been a mentor for the recipients of the
        <a href="https://investigativejournalismforeu.net/" target="_blank" rel="noopener">cross-border investigative grants</a>,
        helping them up their data game.
      </p>
    </article>
  </section>

  <section>
    <h2>🤝 Clients</h2>

    <article class="role">
      <h3>Correctiv.Europe</h3>
      <p>
        Since 2026 I have been collaborating with
        <a href="https://correctiv.org" target="_blank" rel="noopener">Correctiv</a>'s European desk.
      </p>
    </article>

    <article class="role">
      <h3>Follow The Money</h3>
      <p>
        Since 2022 I have been regularly publishing with Follow The Money as part of the Brussels desk.
      </p>
      <p>
        💰 <a
          href="https://www.ftm.eu/articles/meloni-s-migration-centres-costs-the-italian-taxpayer?share=hsXodvGGIRhOWVs/uOAMJyNRNMzUJR9FuwnrzTjC3%2BK98Zp%2Bh9awxMRQz82xwtY%3D"
          target="_blank"
          rel="noopener"
        >€72,461 per bed: Construction costs soar for Meloni's offshore migrant hubs</a> (2025)<br />
        🌾 <a
          href="https://www.ftm.eu/articles/european-agricultural-subsidy-farmers-billions?share=hWfqgyj%2BVWySnW/25oteVk%2BDsNF9xaPMlJqTRS7sg%2B3kixL7rV5UsZqiN5yMgrE%3D"
          target="_blank"
          rel="noopener"
        >Agricultural millionaires and minimum wages: how European subsidy policy increases inequality</a> (2022)
      </p>
    </article>

    <article class="role">
      <h3>Lost in Europe</h3>
      <p>
        In 2020–2021 I worked with
        <a href="https://lostineurope.eu/" target="_blank" rel="noopener">a European team of journalists</a>
        reporting on migration, especially children missing in migration. The story with most impact I
        worked on quantified the number of missing children in European asylum centres. It was initially
        published in 9 outlets and was republished as far as Russia, Syria and South America.
      </p>
      <p>
        👧👦 <a
          href="https://www.theguardian.com/global-development/2021/apr/21/nearly-17-child-migrants-a-day-vanished-in-europe-since-2018"
          target="_blank"
          rel="noopener"
        >Nearly 17 child migrants a day vanished in Europe since 2018</a> (2021, The Guardian)
      </p>
    </article>

    <article class="role">
      <h3>Arena for Journalism in Europe</h3>
      <p>
        🏆 Won the
        <a href="https://www.europeanpressprize.com/laureate/cities-for-rent/" target="_blank" rel="noopener">European Press Prize</a>
        for <em>Cities for Rent</em>.
      </p>
      <p>
        In 2021 I co-led <em>Cities for Rent</em>, a European collaborative reporting project on
        corporate landlords convened by
        <a href="https://journalismarena.eu/" target="_blank" rel="noopener">Arena for Journalism in Europe</a>.
        As data coordinator, I collected, cleaned, and standardized data from our partner newsrooms,
        and prepared it for the final data visualisations.
      </p>
      <p>
        🏙️ <a href="https://cities4rent.journalismarena.media/" target="_blank" rel="noopener">See all the publications</a>
      </p>
    </article>

    <article class="role">
      <h3>OCCRP</h3>
      <p>
        🏆 <em>Kočner's Library</em> won the
        <a
          href="https://osf.sk/en/pribehy/nadacia-otvorenej-spolocnosti-ocenila-najkvalitnejsie-prace-slovenskych-novinarok-a-novinarov/"
          target="_blank"
          rel="noopener"
        >Award of the Investigative Journalism Fund</a>
        in Slovakia.
      </p>
      <p>
        In 2020 I was part of the
        <a href="https://www.occrp.org" target="_blank" rel="noopener">OCCRP</a>'s data team on two
        major European projects.
      </p>
      <p>
        <strong>Kočner's Library.</strong> In late 2019, reporters at the
        <a
          href="https://www.icjk.sk/94/Odhalenia-Kocnerovej-kniznice-00-Kocnerov-vplyv-Kristufkovej-dovolenka-Ficove-telefonaty-Bodorove-peniaze-a-mnohe-dalsie"
          target="_blank"
          rel="noopener"
        >Ján Kuciak Investigative Center</a>
        in Bratislava and the
        <a
          href="https://www.investigace.cz/kocnerova-kniznica-verejnych-tajemstvi/"
          target="_blank"
          rel="noopener"
        >Czech investigative reporting platform Investigace.cz</a>
        were given access to the complete police case file on the brutal assassination of Martina
        Kušnírová and Ján Kuciak in 2018. Slovak police and Europol had collected a total of 53 TB of
        material — digital copies of seized computers and phones, footage from security cameras, and
        other evidence. I
        <a
          href="https://medium.com/occrp-unreported/how-to-eat-an-elephant-9da7e146e475"
          target="_blank"
          rel="noopener"
        >helped to transfer and analyse the information</a>
        and share it with local newsrooms to produce dozens of articles across multiple outlets.
      </p>
      <p>
        🐘 <a href="https://archive.is/B7oiK" target="_blank" rel="noopener">How to eat an elephant</a> (2020, OCCRP)
      </p>
      <p>
        <strong>Europe's COVID-19 Spending Spree Unmasked.</strong> As COVID-19 hit Europe, government
        public spending rules were no longer adhered to. OCCRP set up a European collaboration to
        collect and analyse COVID-19 public tender data. As the data coordinator, I collected,
        cleaned and standardized 21 billion euros of tender data from 37 countries.
      </p>
      <p>
        😷 <a href="https://www.occrp.org/en/coronavirus/europes-covid-19-spending-spree-unmasked" target="_blank" rel="noopener">Publication</a><br />
        📊 <a href="https://www.open-contracting.org/2021/02/04/unmasking-emergency-procurement-how-we-published-37000-european-covid-19-related-tenders/" target="_blank" rel="noopener">Background on the data collection</a> (OpenContracting.org)<br />
        😺 <a href="https://github.com/occrp/COVID-19-spending-2020" target="_blank" rel="noopener">GitHub repository with all the data</a>
      </p>
    </article>

    <article class="role">
      <h3>Pointer (KRO-NCRV)</h3>
      <p>
        In 2019 I was briefly employed by
        <a href="https://pointer.kro-ncrv.nl/" target="_blank" rel="noopener">Pointer</a>,
        a pioneer data newsroom of the Dutch broadcaster KRO-NCRV. We combined the expertise of data
        specialists, coders and designers for each story. Examples (in Dutch):
      </p>
      <p>
        🐦‍⬛ <a
          href="https://web.archive.org/web/20240704155747/https://pointer.kro-ncrv.nl/zeldzame-vogels-in-gevaar-door-stikstofvervuiling"
          target="_blank"
          rel="noopener"
        >Rare birds at risk due to nitrogen pollution</a><br />
        🍄 <a
          href="https://pointer.kro-ncrv.nl/de-waterschappen-kosten-jaarlijks-drie-miljard-en-vooral-jij-betaalt-die-rekening"
          target="_blank"
          rel="noopener"
        >The water boards cost three billion euros annually, and you pay that bill</a><br />
        📃 <a
          href="https://pointer.kro-ncrv.nl/een-overheidsdocument-aangevraagd-daar-moet-je-soms-jaren-op-wachten"
          target="_blank"
          rel="noopener"
        >Requested a government document? Sometimes you have to wait for years</a>
      </p>
    </article>

    <article class="role">
      <h3>Investico</h3>
      <p>
        Between 2014 and 2018 I worked as data journalist with the independent platform for
        structural investigative journalism. Example story (in Dutch):
      </p>
      <p>
        🪴 <a
          href="https://web.archive.org/web/20190424064302/https://www.platform-investico.nl/artikel/bekijk-van-wie-die-coffeeshop/"
          target="_blank"
          rel="noopener"
        >Whose coffeeshop is that?</a>
      </p>
    </article>

    <article class="role">
      <h3>OneWorld</h3>
      <p>
        Between 2014 and 2018 I worked as data journalist with a small Dutch magazine focused on
        sustainability and human rights. Examples (in Dutch):
      </p>
      <p>
        ✈️ <a
          href="https://web.archive.org/web/20230705083819/https://www.oneworld.nl/klimaat/laat-klm-nou-echt-een-ghanese-familie-onze-co2uitstoot-compenseren/"
          target="_blank"
          rel="noopener"
        >Did KLM really have a Ghanaian family offset our CO2 emissions?</a><br />
        👩🏽‍🦽‍➡️ <a
          href="https://web.archive.org/web/20230708222145/https://www.oneworld.nl/mensenrechten/u-kunt-hier-niet-naar-de-wc/"
          target="_blank"
          rel="noopener"
        >You can not go to the toilet here</a><br />
        🚂 <a
          href="https://web.archive.org/web/20230714044020/https://www.oneworld.nl/klimaat/met-de-nachttrein-naar-het-buitenland-niet-vanuit-nederland/"
          target="_blank"
          rel="noopener"
        >Sleeping on the rail</a>
      </p>
    </article>
  </section>
</article>

<style>
  .hello {
    max-width: 42rem;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }
  .hello__hero {
    margin: 2.5rem 0 2rem;
  }
  .hello__hero h1 {
    font-family: var(--display);
    text-transform: uppercase;
    font-size: clamp(2.5rem, 8vw, 5rem);
    line-height: 0.95;
    letter-spacing: -0.01em;
    margin: 0;
    color: var(--pink);
    -webkit-text-stroke: 2px var(--ink);
    paint-order: stroke fill;
  }
  .hello__lede {
    font-family: var(--slab);
    font-weight: 400;
    margin: 1.25rem 0 0;
    font-size: 1.05rem;
    color: var(--body);
    max-width: 36rem;
    line-height: 1.65;
  }
  .hello__contact {
    font-family: var(--slab);
    font-size: 1.05rem;
    line-height: 1.65;
    color: var(--body);
    margin: 1.25rem 0 0;
  }
  .hello__contact a {
    border-bottom: 2px solid var(--pink);
    padding-bottom: 1px;
  }
  .hello__contact a:hover { background: var(--pink); }

  .hello h2 {
    font-family: var(--display);
    text-transform: uppercase;
    font-size: 1.4rem;
    letter-spacing: 0.01em;
    line-height: 1.15;
    margin: 3.25rem 0 1.25rem;
    color: var(--ink);
  }

  .role {
    margin: 1.5rem 0 0;
    padding: 1rem 1.1rem;
    background: var(--card);
    border: var(--border);
  }
  .role h3 {
    font-family: var(--slab);
    font-weight: 700;
    font-size: 1.1rem;
    margin: 0 0 0.5rem;
    color: var(--ink);
  }
  .role p {
    margin: 0.6rem 0 0;
    color: var(--body);
    line-height: 1.55;
  }
  .role p:first-of-type { margin-top: 0; }
  .role a {
    border-bottom: 2px solid var(--pink);
    padding-bottom: 1px;
  }
  .role a:hover { background: var(--pink); }
</style>
