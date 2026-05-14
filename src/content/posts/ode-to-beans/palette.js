// Reads CSS custom properties from palette.css and exposes them to JS/D3.
// Call this only in the browser (inside onMount or event handlers).

const read = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const legumeColors = () => ({
  blackBean: read('--color-black-bean'),
  kidney: read('--color-kidney'),
  adzuki: read('--color-adzuki'),
  coralLentil: read('--color-coral-lentil'),
  amberDal: read('--color-amber-dal'),
  chickpea: read('--color-chickpea'),
  mung: read('--color-mung'),
  duPuy: read('--color-du-puy'),
});

export const schemeLegume = () => {
  const c = legumeColors();
  return [
    c.blackBean,
    c.kidney,
    c.coralLentil,
    c.amberDal,
    c.chickpea,
    c.mung,
    c.duPuy,
    c.adzuki,
  ];
};

export const warmRamp = () => [1, 2, 3, 4, 5, 6, 7].map((i) => read(`--seq-warm-${i}`));
export const coolRamp = () => [1, 2, 3, 4, 5, 6, 7].map((i) => read(`--seq-cool-${i}`));

export const surfaces = () => ({
  parchment: read('--surface-parchment'),
  cream: read('--surface-cream'),
  linen: read('--surface-linen'),
  stone: read('--surface-stone'),
  dark: read('--surface-dark'),
});

export const chart = () => ({
  grid: read('--chart-grid-color'),
  axis: read('--chart-axis-color'),
  tooltipBg: read('--chart-tooltip-bg'),
  tooltipBorder: read('--chart-tooltip-border'),
});
