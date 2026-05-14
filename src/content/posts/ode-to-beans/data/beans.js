// Facts for the bean-size chart. Soaking advice follows the author's stance
// in docs/article.md (quick-soak the small ones if you like; only the largest
// beans truly need the 8-hour soak). Cook times assume stovetop, simmered
// uncovered, after any recommended soak.
//
// `sizeMm` is the nominal single-seed diameter in millimetres, used to scale
// the bean illustrations in BeanSizes.svelte. Values are approximate
// (single-bean diameters vary within a few mm) — refine to taste.
// `image` is the filename in scrolly/public/images/beans/ (filenames don't
// always match the slug, so they're mapped here explicitly).

export const beanFacts = {
  'red-lentils': {
    name: 'Red lentils (split)',
    sizeMm: 3,
    image: 'red-lentils.png',
    soak: 'Not needed.',
    cookTime: '10–15 min',
    cuisines: ['Indian', 'Middle Eastern', 'Turkish', 'Ethiopian'],
    note: 'Splits and hulled, breaks down into a creamy purée. Easy to digest.',
  },
  'beluga-lentils': {
    name: 'Beluga lentils',
    sizeMm: 3,
    image: 'black_lentils.png',
    soak: 'Optional. Quick-soak makes them easier to digest and reduces cooking time.',
    cookTime: '30–40 min (20–25 min after soaking)',
    cuisines: ['French', 'Mediterranean', 'Modern Western'],
    note: 'Glossy black, holds its shape. Good for salads and warm grain bowls.',
  },
  'moong-dal': {
    name: 'Moong dal (split)',
    sizeMm: 4,
    image: 'moong-dal.png',
    soak: 'Not needed.',
    cookTime: '15–20 min',
    cuisines: ['Indian', 'South Asian'],
    note: 'Split mung; light, slightly sweet, very gentle on the gut. Easy to digest.',
  },
  'mung-beans': {
    name: 'Mung beans',
    sizeMm: 4,
    image: 'moong-beans.png',
    soak: 'Optional, but recommended.',
    cookTime: '30–40 min (20–25 min after soaking)',
    cuisines: ['Indian', 'Chinese', 'Korean', 'Southeast Asian'],
    note: 'Whole green mung; the parent bean of moong dal. Mild, slightly sweet. Sprout for bean sprouts.',
  },
  'du-puy-lentils': {
    name: 'Du Puy lentils',
    sizeMm: 5,
    image: 'dupuy.png',
    soak: 'Optional. Quick-soak makes them easier to digest and reduces cooking time.',
    cookTime: '30–40 min (20–25 min after soaking)',
    cuisines: ['French', 'Mediterranean'],
    note: 'Speckled blue-green, nutty flavour, firm bite, nice in salads and soups.',
  },
  'green-lentils': {
    name: 'Green lentils',
    sizeMm: 5,
    image: 'green-lentils.png',
    soak: 'Optional, but recommended.',
    cookTime: '30–40 min (20–25 min after soaking)',
    cuisines: ['French', 'Italian', 'Middle Eastern', 'North African'],
    note: 'Whole, hulled lentil, earthy, holds shape for stews and salads.',
  },
  'brown-lentils': {
    name: 'Brown lentils',
    sizeMm: 6,
    image: 'brown-lentils.png',
    soak: 'Optional, but recommended.',
    cookTime: '30–40 min',
    cuisines: ['Middle Eastern', 'Mediterranean', 'North American'],
    note: 'The workhorse lentil. Softens more than green, good for thick soups.',
  },
  'adzuki-beans': {
    name: 'Adzuki beans',
    sizeMm: 6,
    image: 'adzuki.png',
    soak: 'Optional. Quick-soak (1 h) is enough if you like them gentler.',
    cookTime: '45–60 min (30 min after soaking)',
    cuisines: ['Japanese', 'Korean', 'Chinese'],
    note: 'Small reddish bean, often used in sweet dishes (red bean paste, anko).',
  },
  'black-eyed-peas': {
    name: 'Black-eyed peas',
    sizeMm: 8,
    image: 'back-eyed-peas.png',
    soak: 'Optional, but recommended.',
    cookTime: '30–45 min',
    cuisines: ['West African', 'Indian', 'Mediterranean'],
    note: 'Thin-skinned cowpea is the most digestible "large" legume.',
  },
  'black-beans': {
    name: 'Black beans',
    sizeMm: 9,
    image: 'black-beans.png',
    soak: '8 hours recommended.',
    cookTime: '60–90 min after soaking',
    cuisines: ['Latin American', 'Cuban', 'Brazilian', 'Mexican'],
    note: 'Dense and meaty. The bigger the bean, the more it benefits from a long soak.',
  },
  'chickpeas': {
    name: 'Chickpeas',
    sizeMm: 10,
    image: 'chickpeas.png',
    soak: '8 hours recommended.',
    cookTime: '60–90 min after soaking',
    cuisines: ['Mediterranean', 'Middle Eastern', 'North African', 'Indian', 'Spanish'],
    note: 'Versatile: hummus, stews, roasted as a snack, ground into besan flour.',
  },
  'edamame': {
    name: 'Edamame',
    sizeMm: 11,
    image: 'edamame.png',
    soak: 'Not applicable',
    cookTime: '3–5 min if frozen',
    cuisines: ['Japanese', 'Chinese', 'Korean'],
    note: 'Young soybeans in the pod. Boil briefly in salted water; pop out to eat.',
  },
  'kidney-beans': {
    name: 'Kidney beans',
    sizeMm: 14,
    image: 'kidney-beans.png',
    soak: '8 hours required.',
    cookTime: '60–90 min — boil hard for the first 10 min to destroy lectins',
    cuisines: ['Indian', 'Mexican', 'Caribbean'],
    note: 'Large and dense; raw or undercooked kidneys are toxic, so the hard boil matters.',
  },
};
