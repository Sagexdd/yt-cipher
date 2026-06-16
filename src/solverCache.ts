import { InstrumentedLRU } from "./instrumentedCache.js";
import type { Solvers } from "./types.js";

const cacheSizeEnv = process.env.SOLVER_CACHE_SIZE;
const maxCacheSize = cacheSizeEnv ? parseInt(cacheSizeEnv, 10) : 50;
export const solverCache = new InstrumentedLRU<Solvers>('solver', maxCacheSize);
