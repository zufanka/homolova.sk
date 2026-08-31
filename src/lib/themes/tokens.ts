/**
 * JS/D3 bridge to theme CSS custom properties (generalizes the per-post
 * palette readers like ode-to-beans/palette.js).
 *
 * IMPORTANT: call these browser-side only (inside onMount, event handlers, or
 * effect runes) — tokens hang off the `[data-theme]` site wrapper element, not
 * `:root`, so they must be resolved against a live DOM element.
 */

export function resolveThemeEl(el?: Element): Element {
  if (el) return el;
  return document.querySelector('[data-theme]') ?? document.documentElement;
}

export function cssVar(name: string, el?: Element): string {
  return getComputedStyle(resolveThemeEl(el)).getPropertyValue(name).trim();
}

export function getTokens(names: string[], el?: Element): Record<string, string> {
  const target = resolveThemeEl(el);
  const style = getComputedStyle(target);
  const out: Record<string, string> = {};
  for (const name of names) {
    out[name] = style.getPropertyValue(name).trim();
  }
  return out;
}
