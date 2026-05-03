declare global {
  namespace App {}
}

declare module '*.svx' {
  import type { SvelteComponent } from 'svelte';
  export default class extends SvelteComponent {}
  export const metadata: Record<string, unknown>;
}

declare module '*.md' {
  import type { SvelteComponent } from 'svelte';
  export default class extends SvelteComponent {}
  export const metadata: Record<string, unknown>;
}

export {};
