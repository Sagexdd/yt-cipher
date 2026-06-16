import { InstrumentedLRU } from "./instrumentedCache.js";

const cacheSizeEnv = process.env.PREPROCESSED_CACHE_SIZE;
const maxCacheSize = cacheSizeEnv ? parseInt(cacheSizeEnv, 10) : 150;
export const preprocessedCache = new InstrumentedLRU<string>('preprocessed', maxCacheSize);
