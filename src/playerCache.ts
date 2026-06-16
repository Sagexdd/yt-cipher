import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { cacheSize, playerScriptFetches } from "./metrics.js";
import { PlayerScript } from "./player.js";

const ignorePlayerScriptRegion = process.env.IGNORE_SCRIPT_REGION === "true";

export const CACHE_DIR = path.join(os.tmpdir(), 'yt-cipher', 'player_cache');

export async function getPlayerFilePath(playerScript: PlayerScript): Promise<string> {
    const playerUrl = playerScript.toUrl();
    let cacheKey: string;
    if (ignorePlayerScriptRegion) {
        cacheKey = playerScript.id;
    } else {
        const hash = crypto.createHash('sha256').update(playerUrl).digest('hex');
        cacheKey = hash;
    }
    const filePath = path.join(CACHE_DIR, `${cacheKey}.js`);

    try {
        const stat = await fs.stat(filePath);
        // Update atime/mtime to mark it as recently used
        const now = new Date();
        await fs.utimes(filePath, now, stat.mtime || now);
        return filePath;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log(`Cache miss for player: ${playerUrl}. Fetching...`);
            const response = await fetch(playerUrl);
            playerScriptFetches.labels({ player_url: playerUrl, status: String(response.status) }).inc();
            if (!response.ok) {
                throw new Error(`Failed to fetch player from ${playerUrl}: ${response.statusText}`);
            }
            const playerContent = await response.text();
            await fs.writeFile(filePath, playerContent, 'utf8');

            // Update cache size for metrics
            try {
                const files = await fs.readdir(CACHE_DIR);
                cacheSize.labels({ cache_name: 'player' }).set(files.length);
            } catch {}
            
            console.log(`Saved player to cache: ${filePath}`);
            return filePath;
        }
        throw error;
    }
}

export async function initializeCache() {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // Clean out 14 day unused ones
    let fileCount = 0;
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    console.log(`Cleaning up player cache directory: ${CACHE_DIR}`);
    try {
        const files = await fs.readdir(CACHE_DIR);
        for (const file of files) {
            const filePath = path.join(CACHE_DIR, file);
            const stat = await fs.stat(filePath);
            const lastAccessed = stat.atime?.getTime() || stat.mtime?.getTime() || stat.birthtime?.getTime();
            if (lastAccessed && (Date.now() - lastAccessed > fourteenDays)) {
                console.log(`Deleting stale player cache file: ${filePath}`);
                await fs.unlink(filePath);
            } else {
                fileCount++;
            }
        }
    } catch (err) {
        console.error("Error during cache initialization cleanup:", err);
    }
    cacheSize.labels({ cache_name: 'player' }).set(fileCount);
    console.log(`Player cache directory ensured at: ${CACHE_DIR}`);
}
