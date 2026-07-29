/**
 * Small LRU + in-flight registry, one instance per resource kind (decoded
 * geometry, heat-island bitmaps).
 *
 * Ported from the `geoCache/geoOrder/inflight` and `uhiCache/uhiOrder/
 * uhiInflight` triples in park-ing's prototype, which were identical apart
 * from the loader and the disposal step. Zooming never refetches (the data is
 * vector); reselecting a cached city is instant; fetches superseded by a newer
 * selection are aborted.
 *
 * Deliberately *not* reactive: this is a plain object graph driven by the
 * renderer, and nothing in the UI reads it directly.
 */
export interface ResourceCacheOptions<T> {
	/** How many entries survive; the pinned slug is never evicted. */
	limit: number;
	load: (slug: string, signal: AbortSignal | undefined) => Promise<T>;
	/** Release native resources (e.g. `ImageBitmap.close()`) on eviction. */
	dispose?: (value: T) => void;
}

export class ResourceCache<T> {
	/** The slug currently on screen — exempt from eviction. */
	keep: string | null = null;

	readonly #limit: number;
	readonly #load: ResourceCacheOptions<T>['load'];
	readonly #dispose?: (value: T) => void;
	readonly #values = new Map<string, T>();
	readonly #order: string[] = [];
	readonly #inflight = new Map<string, { promise: Promise<T>; ctrl: AbortController | null }>();

	constructor(opts: ResourceCacheOptions<T>) {
		this.#limit = opts.limit;
		this.#load = opts.load;
		this.#dispose = opts.dispose;
	}

	/** The cached value, without starting a load. */
	peek(slug: string): T | undefined {
		return this.#values.get(slug);
	}

	loading(slug: string): boolean {
		return this.#inflight.has(slug);
	}

	touch(slug: string): void {
		const i = this.#order.indexOf(slug);
		if (i > -1) this.#order.splice(i, 1);
		this.#order.push(slug);
	}

	get(slug: string): Promise<T> {
		const hit = this.#values.get(slug);
		if (hit !== undefined) {
			this.touch(slug);
			return Promise.resolve(hit);
		}
		const pending = this.#inflight.get(slug);
		if (pending) return pending.promise;

		const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
		const promise = this.#load(slug, ctrl?.signal).then(
			(value) => {
				this.#inflight.delete(slug);
				this.#values.set(slug, value);
				this.touch(slug);
				this.#evict();
				return value;
			},
			(err: unknown) => {
				this.#inflight.delete(slug);
				throw err;
			}
		);
		this.#inflight.set(slug, { promise, ctrl });
		return promise;
	}

	/** A newer selection supersedes every other in-flight fetch, prefetches
	 *  included. */
	abortOthers(slug: string | null): void {
		for (const [key, entry] of this.#inflight) {
			if (key !== slug) entry.ctrl?.abort();
		}
	}

	destroy(): void {
		for (const entry of this.#inflight.values()) entry.ctrl?.abort();
		this.#inflight.clear();
		if (this.#dispose) for (const v of this.#values.values()) this.#dispose(v);
		this.#values.clear();
		this.#order.length = 0;
	}

	#evict(): void {
		while (this.#order.length > this.#limit) {
			const i = this.#order.findIndex((s) => s !== this.keep);
			if (i < 0) return;
			const [slug] = this.#order.splice(i, 1);
			const value = this.#values.get(slug);
			if (value !== undefined) this.#dispose?.(value);
			this.#values.delete(slug);
		}
	}
}
