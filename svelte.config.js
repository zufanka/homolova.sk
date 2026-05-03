import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', ...mdsvexConfig.extensions],
  preprocess: [vitePreprocess(), mdsvex(mdsvexConfig)],
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    prerender: {
      handleHttpError: ({ path, referrer, message }) => {
        // Standalone interactive pieces live under static/posts/<slug>/index.html
        // and are served directly by the static host; the SvelteKit crawler
        // doesn't see them as routes.
        const candidate = resolve('static', path.replace(/^\/+/, ''), 'index.html');
        if (existsSync(candidate)) return;
        throw new Error(`${message} (linked from ${referrer})`);
      }
    }
  }
};

export default config;
