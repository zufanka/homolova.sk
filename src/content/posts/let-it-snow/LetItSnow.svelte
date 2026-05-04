<script lang="ts">
  import { onMount } from 'svelte';

  const __media__ = import.meta.glob('./media/*', {
    eager: true,
    query: '?url',
    import: 'default'
  }) as Record<string, string>;
  const m = (filename: string) => __media__[`./media/${filename}`];

  let root: HTMLElement;

  onMount(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.5 }
    );
    for (const v of root.querySelectorAll('video')) io.observe(v);
    return () => io.disconnect();
  });

  const video = (src: string, alt: string) => ({ src, alt });

  const paragraphs: { text?: string; video?: { src: string; alt: string }; ending?: boolean }[] = [
    {
      text: `It all started when the squirrel woke up with an unusually cold nose. It slowly unfurled from its nest of dried moss and leaves, then hopped onto the nearest tree branch. The air smelled crisp, and a soft mist hung low in the morning forest.`
    },
    {
      text: `The squirrel saw the mouse down below and shouted, "Hey mouse! Winter has come!" The mouse looked around, a bit confused, then saw a hazelnut flying in its general direction. Startled at first, the mouse caught it, looked up, and laughed.`
    },
    {
      video: video(
        m('Mouse_Takes_Nut_Looks_Up.mp4'),
        'A mouse catches a hazelnut and looks up'
      )
    },
    {
      text: `The squirrel jumped down to the ground, elegantly swaying its bushy tail, and sat next to the mouse. "The only thing missing now is the snow," said the squirrel.`
    },
    {
      text: `"Snow?" asked the mouse, involuntarily shivering as it thought about burrowing paths through frozen water. "Why do you like snow?"`
    },
    {
      text: `The squirrel thought for a moment. "The forest gets so quiet," it said. "It's like a blanket covering the world. It's so peaceful."`
    },
    {
      text: `"Somebody said snow?" The sound carried from the underbrush. A tiny marten came scurrying toward them, its white breast gleaming in the first sun rays. "I love snow!" exclaimed the marten, its long body twisting into a happy circle as it chased its own tail.`
    },
    { text: `"Let's have snow then!" said the squirrel resolutely.` },
    { text: `The mouse, now nibbling on the hazelnut, laughed again. "Well, it's not like you can make it."` },
    { text: `"Why not? It comes from the treetops," said the marten, looking up dreamily.` },
    {
      text: `"No, it does not," objected the squirrel. It knew that snow came from much higher than that; it only collected on the branches before falling. But where did it really come from?`
    },
    {
      video: video(m('squirrel_looking_up.mp4'), 'A squirrel looking up at the sky')
    },
    {
      text: `From above came a loud noise. "What are you up to here?" A crow had taken an interest in the assembly. Perched on a low branch, its head cocked to the right, it watched them intently.`
    },
    { text: `"Hey crow!" shouted the squirrel. "Where does snow come from?"` },
    { text: `The crow cocked its head to the left. "From the clouds, of course," it said wisely.` },
    {
      text: `The clouds, then, thought the squirrel. "Maybe we can shake the clouds to make it snow?"`
    },
    { text: `"Yes, yes, yes!" the tiny marten shouted, spinning in circles.` },
    { text: `"But we can't fly," said the squirrel sadly.` },
    {
      text: `The marten stopped and looked at the squirrel with big, dark eyes. "Then we call the birds! Will you help us, crow?"`
    },
    {
      text: `The crow was skeptical, but interested in the experiment. "I will help you," it said, then flapped its tar-black wings and flew away, cawing into the distance.`
    },
    {
      text: `Not too long after, the birds began to arrive: blackbirds, sparrows, tits, and robins. The forest boomed with birdsong as they discussed strategies. A robin suggested pecking holes in the clouds to let the white out; a sparrow thought they should all flap their wings at once to blow the snow down.`
    },
    {
      video: video(m('birds.mp4'), 'Various small birds gathering on forest branches')
    },
    {
      text: `Eventually, the falcon arrived. Rumors of a grand plan had sparked a heroic feeling in the bird of prey. As it landed on a high branch, the chirping grew quiet. The mouse shivered. "This is stupid," it said in a whisper. "You can't make it snow anyway." It dove into a hole in the ground and disappeared.`
    },
    {
      text: `The crow let out a loud caw to address the assembly. "We are here to make it snow! To do it, we go up there and shake the clouds! Let's commence!"`
    },
    {
      text: `The gathering let out a cry and flew high into the gray sky. The squirrel was excited. It left the tiny marten on the ground and climbed the highest tree to watch the spectacle. The smaller birds flew into the low-hanging cloud, circling and snapping their beaks.`
    },
    {
      text: `Then the falcon rose. It flew high, pierced the cloud, and emerged on the other side, where the sun shone brightly. It dove back into the thick mist, looking for anything it could shake loose.`
    },
    { video: video(m('falcon.mp4'), 'A falcon flying above the clouds') },
    {
      text: `This went on for a long time. At first, the squirrel enjoyed the spectacle immensely. The anticipation of tiny snowflakes beginning to fall was nearly too much to bear. The crow sat beside the squirrel, its head cocked to one side, carefully observing the process.`
    },
    {
      text: `But no matter how much the birds flew zig-zag through the clouds, nothing much happened. The clouds were just perfectly wet, empty mist. One by one, the birds grew exhausted. They flew away in search of food and shelter.`
    },
    {
      text: `Also the squirrel climbed down from the tree. The tiny marten was taking a nap in the underbrush and woke when the squirrel hopped down. "Is it snowing already?" it asked sleepily. "No," said the squirrel, disappointed.`
    },
    {
      text: `Soon after, the crow and the falcon returned to the original place of assembly. The crow straightened its feathers and proclaimed, "This experiment was a failure," then flew away. The falcon hungrily eyed the two furry animals and flew off as well. The day was growing dark.`
    },
    { video: video(m('Crow_Animation_Look_Up_and_Fly.mp4'), 'A crow looks up and flies away') },
    {
      text: `The forest felt colder than ever. The squirrel felt silly for believing the clouds could be shaken. "We can not make it snow after all", it sighed. When it was time to sleep, the marten turned to the squirrel and said, "Don't be sad. When the time comes, the snow will fall. I'm sure of it," then disappeared into the night.`
    },
    {
      text: `Then came another day, and then another. For another week, the forest grew colder, but the sky remained gray and dry. The days were short and energy was low, but every day, the squirrel, the mouse, and the marten met. They would hop around the forest for a while, then huddle together for an afternoon nap.`
    },
    {
      text: `They shared laughs and warmth and the squirrel actually felt quite cozy. One evening when it lay in its nest half asleep, a thought crossed its mind: Maybe even if the snow never came, it could still enjoy winter all the same.`
    },
    {
      text: `The next morning, the squirrel opened its eyes to a strange, bright silence. It hopped onto the nearest branch and saw only the mouse's tiny head peeking out of a heap of freshly fallen snow. "Hey!" shouted the mouse. "It's snowing! All by itself!" The marten jumped up and down on its little paws, singing a marten song nobody understood. The forest felt soft and peaceful. And the squirrel felt a deep joy in its tiny heart.`
    },
    {
      video: video(
        m('cuddle_puddle.mp4'),
        'The squirrel, mouse, and marten cuddling together in the snow'
      ),
      ending: true
    },
    { text: `The End`, ending: true }
  ];

  const breakIndex = paragraphs.findIndex((p) => p.text?.startsWith(`Then came another day`));
</script>

<div class="winter" bind:this={root}>
  <header class="hero">
    <div class="hero-content">
      <h1>Let it snow</h1>
      <p class="hero-subtitle">A winter tale from the forest</p>
      <p class="hero-author">by <a target="_blank" rel="noopener" href="https://homolova.sk/hello">Ada Homolova</a></p>
    </div>
    <div class="hero-image">
      <img src={m('squirrel_sleeping.png')} alt="A squirrel sleeping in its nest" />
    </div>
  </header>

  {#each paragraphs as block, i}
    {#if block.video}
      <div class="video-section" class:video-section-ending={block.ending}>
        <div class="video-wrapper">
          <video autoplay muted playsinline loop aria-label={block.video.alt}>
            <source src={block.video.src} type="video/mp4" />
          </video>
        </div>
      </div>
    {:else}
      {#if i === breakIndex}
        <article class="story">
          <p class="section-break">***</p>
        </article>
      {/if}
      <article class="story">
        <p class:ending={block.ending}>{block.text}</p>
      </article>
    {/if}
  {/each}

  <aside class="reflection">
    <p>Thank you for reading!</p>
    <p>
      This story was inspired by my own journey of learning to release what I cannot control, and
      by the fact that it hasn't snowed here in the mountains for more than a month now.
    </p>
    <p>
      In the past 100 years, the
      <a
        href="https://www.eurac.edu/en/magazine/in-a-hundred-years-snowfall-in-the-alps-has-decreased-by-more-than-a-third"
        target="_blank"
        rel="noopener">snowfall in the Alps has fallen by one third</a
      >, and nearly by half around Innsbruck, where I live. The mountains feel timeless and
      eternal, yet they are changing rapidly. It seems, however, that we are reluctant to accept
      this.
    </p>
    <figure class="reflection-figure">
      <img
        src={m('snowfall.png')}
        alt="Map of the Alps showing snowfall decline data over the past 100 years"
      />
      <figcaption>Eurac Research, 2024</figcaption>
    </figure>
    <p>
      Last week, I took the gondola up the mountain to find white pistes alive with whooshing skis
      and snowboards, bordered by a forest where only patches of snow remain. Snow cannons whirring
      through the night, insisting on winter. Seen from a distance, the pistes cut an anomalous
      vein of white through the green-brown forest. They are a symbol of our attempt to hold on to
      control we do not have.
    </p>
    <p>
      I am not worried about the mountains. They will outlast us, no matter what. Nor am I worried
      about humans. Since we defeated our predators, we have been our own most challenging enemy.
      Still, I like to imagine a world in which we are not that. A world where we live in sync with
      one another and with our planet, taking care of our most precious gifts: the things that can
      not be bought, yet give life in return.
    </p>
    <p>Happy Holidays!</p>
  </aside>
</div>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Berkshire+Swash&family=Nunito:ital,wght@0,400;0,600;1,400&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<style>
  @font-face {
    font-family: 'Lombard';
    src: url('./media/Lombard-regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }

  .winter {
    display: flow-root;
    font-family: 'Nunito', sans-serif;
    background-color: #f5f1e8;
    color: #2a2a2a;
    line-height: 1.9;
    font-size: 1.2rem;
  }

  .winter h1 {
    font-family: 'Lombard', 'Berkshire Swash', cursive;
    font-size: 5rem;
    font-weight: 400;
    margin-bottom: 0.5rem;
    color: #1a1a1a;
    line-height: 1.1;
  }

  .hero {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 70vh;
    padding: 3rem;
    gap: 4rem;
  }
  .hero-content {
    flex: 1;
    max-width: 400px;
  }
  .hero-subtitle {
    font-style: italic;
    color: #666;
    font-size: 1.3rem;
  }
  .hero-author {
    font-size: 1rem;
    color: #888;
    margin-top: 0.5rem;
  }
  .hero-author a {
    color: #5a7a5a;
    text-decoration: none;
  }
  .hero-author a:hover {
    text-decoration: underline;
  }
  .hero-image {
    flex: 1;
    max-width: 450px;
  }
  .hero-image img {
    width: 100%;
    display: block;
  }

  .story {
    max-width: 680px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  .story p {
    margin: 0 0 1.5rem;
  }

  .video-section {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 2rem;
  }
  .video-section-ending {
    margin: 1rem auto;
  }
  .video-wrapper {
    position: relative;
  }
  .video-wrapper video {
    width: 100%;
    display: block;
    mask-image:
      linear-gradient(to right, transparent, black 12%, black 88%, transparent),
      linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
    mask-composite: intersect;
    -webkit-mask-image:
      linear-gradient(to right, transparent, black 12%, black 88%, transparent),
      linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
    -webkit-mask-composite: source-in;
  }

  .section-break {
    text-align: center;
    margin: 3rem 0;
    color: #b5ad9e;
    font-size: 1.5rem;
    letter-spacing: 0.5em;
  }

  .ending {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #d9d4c7;
    text-align: center;
    font-style: italic;
    color: #666;
  }

  .reflection {
    max-width: 680px;
    margin: 2rem auto 3rem;
    padding: 2rem;
    background-color: #ebe7dc;
    border-left: 3px solid #b5ad9e;
    font-size: 1rem;
    color: #555;
    line-height: 1.7;
  }
  .reflection p {
    margin: 0 0 1rem;
  }
  .reflection p:last-child {
    margin: 0;
  }
  .reflection-figure {
    margin: 1.5rem 0;
  }
  .reflection-figure img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 0 0.5rem 0;
  }
  .reflection-figure figcaption {
    font-size: 0.85rem;
    color: #888;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .winter {
      font-size: 1.1rem;
    }
    .hero {
      flex-direction: column-reverse;
      min-height: auto;
      padding: 2rem 1.5rem 3rem;
      gap: 2rem;
    }
    .hero-content {
      text-align: center;
      max-width: 100%;
    }
    .hero-image {
      max-width: 280px;
    }
    .story {
      padding: 0 1.5rem;
    }
    .winter h1 {
      font-size: 3rem;
    }
    .video-section {
      padding: 0 1rem;
    }
    .reflection {
      margin: 2rem 1rem 3rem;
      padding: 1.5rem;
    }
  }
</style>
