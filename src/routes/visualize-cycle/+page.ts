export const prerender = true;

export const load = () => ({
  meta: {
    ogTitle: 'Between the Cycles — homolova.sk',
    ogDescription:
      'Enter the start date of each period and see what your menstrual cycle really looks like. Your data never leaves the page.',
    ogType: 'website' as const,
    ogImage: '/og/visualize-cycle.png',
    canonical: '/visualize-cycle',
    footerAccent: 'var(--blue)'
  }
});
