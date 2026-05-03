import { remarkRelativeImages } from './scripts/remark-relative-images.js';

/** @type {import('mdsvex').MdsvexOptions} */
const config = {
  extensions: ['.svx', '.md'],
  smartypants: { dashes: 'oldschool' },
  remarkPlugins: [remarkRelativeImages]
};

export default config;
