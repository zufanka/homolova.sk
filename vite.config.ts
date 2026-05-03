import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Dev-only: rewrite directory URLs (e.g. `/posts/missing-voters/`) to their
 * `index.html` when one exists in `static/`. Mirrors how GitHub Pages serves
 * the site in production. Without this, standalone interactive pieces 404 in
 * `vite dev`.
 */
function serveStaticIndex(): Plugin {
  return {
    name: 'serve-static-index',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [path, query = ''] = (req.url ?? '').split('?');
        if (!path.endsWith('/') || path === '/') return next();
        const file = resolve('static', path.replace(/^\/+/, ''), 'index.html');
        if (existsSync(file)) {
          req.url = path + 'index.html' + (query ? '?' + query : '');
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [serveStaticIndex(), sveltekit()]
});
