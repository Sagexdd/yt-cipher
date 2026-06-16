import fs from "fs/promises";
import { getPlayerFilePath } from "./playerCache.js";
import { preprocessedCache } from "./preprocessedCache.js";
import { solverCache } from "./solverCache.js";
import { preprocessPlayer, getFromPrepared } from "./ejs/yt/solver/solvers.js";
import type { Solvers } from "./types.js";
import { workerErrors } from "./metrics.js";
import { PlayerScript } from "./player.js";

export async function getSolvers(playerScript: PlayerScript): Promise<Solvers | null> {
    const playerCacheKey = await getPlayerFilePath(playerScript);

    let solvers = solverCache.get(playerCacheKey);

    if (solvers) {
        return solvers;
    }

    let preprocessedPlayer = preprocessedCache.get(playerCacheKey);
    if (!preprocessedPlayer) {
        const rawPlayer = await fs.readFile(playerCacheKey, "utf8");
        try {
            // Process directly inline without workers for serverless environment compatibility
            preprocessedPlayer = preprocessPlayer(rawPlayer);
        } catch (e: any) {
            const message = e instanceof Error ? e.message : String(e);
            workerErrors.labels({ player_id: playerScript.id, player_type: playerScript.variant, message }).inc();
            throw e;
        }
        preprocessedCache.set(playerCacheKey, preprocessedPlayer);
    }
    
    solvers = getFromPrepared(preprocessedPlayer) as Solvers;
    if (solvers) {
        solverCache.set(playerCacheKey, solvers);
        return solvers;
    }

    return null;
}
