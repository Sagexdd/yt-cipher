import { cacheSize } from "./metrics.js";

export class LruCache<K, V> {
    private cache = new Map<K, V>();
    constructor(private maxSize: number) {}

    get(key: K): V | undefined {
        if (!this.cache.has(key)) return undefined;
        const val = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, val); // Move to end (most recently used)
        return val;
    }

    set(key: K, value: V): this {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
        return this;
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

export class InstrumentedLRU<T> extends LruCache<string, T> {
    constructor(private cacheName: string, maxSize: number) {
        super(maxSize);
    }

    override set(key: string, value: T): this {
        super.set(key, value);
        cacheSize.labels({ cache_name: this.cacheName }).set(this.size);
        return this;
    }

    override delete(key: string): boolean {
        const result = super.delete(key);
        cacheSize.labels({ cache_name: this.cacheName }).set(this.size);
        return result;
    }

    override clear(): void {
        super.clear();
        cacheSize.labels({ cache_name: this.cacheName }).set(this.size);
    }

    public remove(key: string): void {
        this.delete(key);
    }
}
