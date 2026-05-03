import visitPkg from 'unist-util-visit';
const visit = visitPkg.visit ?? visitPkg;

const RELATIVE = /^\.\.?\//;
const IMG_SRC = /<img([^>]*?)\s+src=("|')(\.\.?\/[^"']+)\2/g;

/**
 * mdsvex remark plugin: rewrite relative image paths in posts so authors can
 * write plain markdown / HTML and Vite resolves the assets at build time.
 *
 * Detects:
 *   ![alt](./media/foo.png)
 *   <img src="./media/foo.png">
 *
 * Rewrites to a Svelte expression that looks the asset up in a per-post glob,
 * and injects the matching `import.meta.glob` script block once at the top.
 */
export function remarkRelativeImages() {
  return (tree) => {
    let used = false;

    visit(tree, 'html', (node) => {
      if (!IMG_SRC.test(node.value)) return;
      IMG_SRC.lastIndex = 0;
      node.value = node.value.replace(IMG_SRC, (_m, attrs, _q, src) => {
        used = true;
        return `<img${attrs} src={__media__[${JSON.stringify(src)}]}`;
      });
    });

    visit(tree, 'image', (node, index, parent) => {
      if (!RELATIVE.test(node.url) || index == null || !parent) return;
      used = true;
      const alt = JSON.stringify(node.alt ?? '');
      const src = JSON.stringify(node.url);
      parent.children.splice(index, 1, {
        type: 'html',
        value: `<img src={__media__[${src}]} alt={${alt}} />`
      });
      return ['skip', index + 1];
    });

    if (used) {
      tree.children.unshift({
        type: 'html',
        value:
          "<script>\n" +
          "  const __media__ = import.meta.glob('./media/*', { eager: true, query: '?url', import: 'default' });\n" +
          "</script>\n"
      });
    }
  };
}
