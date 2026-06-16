import { InstrumentedLRU } from "./instrumentedCache.js";

const cacheSizeEnv = process.env.STS_CACHE_SIZE;
const maxCacheSize = cacheSizeEnv ? parseInt(cacheSizeEnv, 10) : 150;
export const stsCache = new InstrumentedLRU<string>('sts', maxCacheSize);
