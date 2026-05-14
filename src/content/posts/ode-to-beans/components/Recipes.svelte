<!--
  Recipe accordion — three cards under the closing prose. Click a header
  to expand; opening another collapses the previous one (single-open).
-->
<script>
  import { slide } from 'svelte/transition';

  const recipes = [
    {
      slug: 'red-lentil-soup',
      title: 'Red lentil soup',
      emoji: '🥣',
      servings: 'for 2 persons',
      image: '/images/recipes/red-lentil-soup.png',
      ingredients: [
        {
          heading: null,
          items: [
            '½ cup red lentils, rinsed',
            '3 cups water',
            '½ medium onion, chopped',
            '1 garlic clove, minced',
            '½ carrot, chopped',
            '½ small potato, peeled and diced',
            '½ small tomato, chopped',
            '½ small celery stalk, chopped',
            '1 tbsp olive oil or butter',
            '½ tsp cumin',
            '¼ tsp turmeric (optional)',
            '½ tsp salt (adjust to taste)',
            'Black pepper to taste',
            '1 small bay leaf',
            '½ tbsp lemon juice (optional, at the end)',
          ],
        },
        {
          heading: 'Garnish (optional)',
          items: ['Fresh cilantro or parsley, toasted pumpkin or sesame seeds, pumpkin oil'],
        },
      ],
      steps: [
        'Combine everything except lemon juice — in a medium pot, add the olive oil, onion, garlic, carrot, potato, tomato, celery, red lentils, water, cumin, turmeric, salt, pepper, and bay leaf.',
        'Bring to a boil — stir everything together. Turn heat to high and bring to a boil.',
        'Simmer — reduce heat to low, cover partially, and simmer for 18–20 minutes until lentils and potato are very soft.',
        'Remove the bay leaf and discard.',
        'Blend (optional) — use an immersion blender for a creamy soup, or leave as is.',
        'Finish — stir in lemon juice if using. Taste and add more salt or pepper if needed.',
        'Serve and garnish as desired.',
      ],
    },
    {
      slug: 'kitchari',
      title: 'Kitchari',
      emoji: '🍲',
      servings: 'for 2 persons',
      image: '/images/recipes/kitchari.png',
      ingredients: [
        {
          heading: 'For the base',
          items: [
            '50 g split moong dal (yellow, skinless)',
            '75 g basmati rice (white or brown; if brown, soak before cooking)',
            '500 ml water (plus extra if needed)',
            '½ tsp turmeric powder',
            '½ tsp cumin seeds (ground)',
            '½ tsp coriander seeds (ground)',
            '¼ tsp mustard seeds',
            '¼ tsp salt',
            '1 pinch asafoetida (hing)',
            '1 tbsp fresh ginger, finely grated or minced',
            '1 tbsp ghee or coconut oil (or a mix)',
            '1–2 tsp lemon or lime juice (optional)',
          ],
        },
        {
          heading: 'Garnish',
          items: ['Fresh herbs like basil, cilantro, parsley or celery leaf'],
        },
        {
          heading: 'Optional veggies',
          items: [
            'A handful of zucchini or carrot, diced small',
            'A handful of spinach, seasonal greens, broccoli or cauliflower',
          ],
        },
      ],
      steps: [
        'In a medium pot, heat ghee or oil over medium heat.',
        'Add salt, cumin seeds, asafoetida (hing) and ginger. Stir for 30 seconds until fragrant.',
        'Add turmeric and stir for 10 seconds.',
        'Add dal and rice. Stir gently for 1 minute to coat with spices.',
        'Pour in 500 ml water (start with this amount).',
        'If adding veggies like carrot or zucchini, add them now.',
        'Bring to a boil, then reduce heat to low. Cover with a lid and simmer for 25–30 minutes.',
        'Stir occasionally to prevent sticking. If it becomes too thick, add more hot water (50–100 ml). Kitchari should be porridge-like.',
        'Once dal and rice are completely soft (they break apart when pressed), turn off the heat.',
        'Stir in lemon or lime juice and fresh herbs (save a little for garnish), or use them as topping.',
      ],
    },
    {
      slug: 'hummus',
      title: 'Hummus: three different ones',
      emoji: '🫘',
      servings: 'for 200 g hummus',
      image: '/images/recipes/hummus.png',
      ingredients: [
        {
          heading: '1. Chickpea hummus — the classic',
          items: [
            '120 g cooked chickpeas (drained weight)',
            '30 g tahini',
            '25 ml fresh lemon juice',
            '1 garlic clove, minced',
            '30–40 ml cold water',
            '15 ml extra virgin olive oil',
            '¼ tsp ground cumin',
            '¼ tsp salt',
          ],
        },
        {
          heading: '2. Du Puy hummus with cashew butter',
          items: [
            '75 g dry Du Puy green lentils (cooked in unsalted water until tender, then drained)',
            '25 g smooth cashew butter',
            '20 ml fresh lemon juice',
            '1 garlic clove, minced',
            '25–35 ml water (for blending)',
            '20 ml extra virgin olive oil',
            '½ tsp ground coriander',
            '¼ tsp smoked paprika',
            '⅓ tsp salt',
          ],
        },
        {
          heading: '3. Black bean hummus with walnut butter',
          items: [
            '125 g cooked black beans (drained weight)',
            '30 g smooth walnut butter',
            'Lime juice from ½ a lime',
            '1 garlic clove, minced',
            '25–40 ml cold water',
            '15 ml toasted walnut oil (or extra virgin olive oil)',
            '½ tsp ground cumin',
            '¼ tsp salt',
          ],
        },
        {
          heading: 'Garnish (optional)',
          items: ['Fresh cilantro, parsley, mint, celery leaf or basil'],
        },
      ],
      steps: [
        'Prepare the base flavour. In a food processor, combine the garlic, citrus juice (lemon or lime), and salt. Let sit for 2 minutes to mellow the garlic.',
        'Add the nut butter or tahini. Blend until thick and creamy.',
        'Add the legume and dry spices. Add the chickpeas, lentils, or black beans along with the ground spices (cumin, coriander, paprika). Blend until coarse and broken down, scraping down the sides as needed.',
        'Thin to desired consistency. With the processor running, slowly add the cold water a little at a time until the hummus becomes smooth, creamy, and fluffy.',
        'Add the oil and optional ingredients. Drizzle in the oil and blend briefly.',
        'Taste and adjust. Add more salt, citrus, or water if needed. Serve with a swirl of extra oil and a sprinkle of paprika or black pepper.',
      ],
      footer:
        'Enjoy with warm pita, raw vegetables, or as a sandwich spread. Store in airtight containers in the fridge for up to 5 days.',
    },
  ];

  let openIndex = $state(-1);
  const toggle = (i) => (openIndex = openIndex === i ? -1 : i);
</script>

<section class="recipes" aria-label="Recipes">
  {#each recipes as r, i}
    {@const isOpen = openIndex === i}
    <article class="card" class:open={isOpen}>
      <button
        class="card-header"
        type="button"
        aria-expanded={isOpen}
        aria-controls={`recipe-${r.slug}`}
        onclick={() => toggle(i)}
      >
        <img class="thumb" src={r.image} alt="" loading="lazy" />
        <span class="title-block">
          <span class="card-title">
            <span class="emoji" aria-hidden="true">{r.emoji}</span>
            {r.title}
          </span>
          <span class="servings">{r.servings}</span>
        </span>
        <span class="chevron" aria-hidden="true">{isOpen ? '−' : '+'}</span>
      </button>

      {#if isOpen}
        <div
          id={`recipe-${r.slug}`}
          class="card-body"
          transition:slide={{ duration: 280 }}
        >
          <div class="ingredients">
            <h3>Ingredients</h3>
            {#each r.ingredients as group}
              {#if group.heading}<h4>{group.heading}</h4>{/if}
              <ul>
                {#each group.items as it}<li>{it}</li>{/each}
              </ul>
            {/each}
          </div>
          <div class="instructions">
            <h3>Instructions</h3>
            <ol>
              {#each r.steps as s}<li>{s}</li>{/each}
            </ol>
            {#if r.footer}
              <p class="footer-note">{r.footer}</p>
            {/if}
          </div>
        </div>
      {/if}
    </article>
  {/each}
</section>

<style>
  .recipes {
    max-width: 640px;
    margin: 1rem auto 3rem;
    padding: 0 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    z-index: 1;
  }

  .card {
    background: var(--surface-cream);
    border: 1.5px solid var(--text-on-light);
    border-radius: 6px;
    overflow: hidden;
    transition: box-shadow 160ms ease-out;
  }
  .card.open {
    box-shadow: 0 6px 24px -16px rgba(0, 0, 0, 0.35);
  }

  .card-header {
    width: 100%;
    display: grid;
    grid-template-columns: 72px 1fr auto;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 0;
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: var(--text-on-light);
  }
  .card-header:hover .chevron {
    background: var(--color-coral-lentil);
    color: var(--surface-parchment);
  }
  .card-header:focus-visible {
    outline: 2px solid var(--color-coral-lentil);
    outline-offset: -2px;
  }

  .thumb {
    width: 72px;
    height: 72px;
    object-fit: contain;
    display: block;
  }

  .title-block {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }
  .card-title {
    font-family: 'Cherry Bomb One', var(--serif);
    font-weight: 400;
    font-size: clamp(1.15rem, 2.2vw, 1.45rem);
    line-height: 1.15;
    color: var(--text-on-light);
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }
  .emoji {
    font-family: var(--sans);
    font-size: 1.1em;
  }
  .servings {
    font-family: var(--sans);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-on-light-muted);
  }

  .chevron {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid var(--text-on-light);
    border-radius: 50%;
    font-family: var(--sans);
    font-weight: 600;
    font-size: 1.15rem;
    line-height: 1;
    color: var(--text-on-light);
    transition: background 160ms ease-out, color 160ms ease-out;
  }

  .card-body {
    padding: 0.25rem 1rem 1.25rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    gap: 1.5rem;
    border-top: 1px dashed var(--surface-stone);
  }
  .card-body h3 {
    font-family: var(--sans);
    font-weight: 600;
    font-size: 0.78rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-kidney);
    margin: 1rem 0 0.5rem;
  }
  .card-body h4 {
    font-family: var(--serif);
    font-weight: 600;
    font-size: 0.98rem;
    color: var(--text-on-light);
    margin: 0.85rem 0 0.25rem;
  }
  .card-body ul,
  .card-body ol {
    font-family: var(--serif);
    font-size: 0.98rem;
    line-height: 1.55;
    color: var(--text-on-light);
    margin: 0 0 0.5rem;
    padding-left: 1.15rem;
  }
  .card-body li {
    margin: 0.2rem 0;
  }
  .card-body ol li {
    margin: 0.35rem 0;
  }
  .footer-note {
    font-family: var(--serif);
    font-style: italic;
    font-size: 0.95rem;
    color: var(--text-on-light-muted);
    margin: 0.75rem 0 0;
  }

  @media (max-width: 640px) {
    .card-body {
      grid-template-columns: 1fr;
      gap: 0.25rem;
    }
    .card-header {
      grid-template-columns: 56px 1fr auto;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
    }
    .thumb {
      width: 56px;
      height: 56px;
    }
  }
</style>
