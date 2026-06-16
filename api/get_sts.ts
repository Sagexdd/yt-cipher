import type { VercelRequest, VercelResponse } from '@vercel/node';
import { wrapHandler } from '../src/middleware.js';
import { getPlayerFilePath } from '../src/playerCache.js';
import { stsCache } from '../src/stsCache.js';
import fs from "fs/promises";

export default wrapHandler(async (req: VercelRequest, res: VercelResponse, playerScript: any) => {
    const playerFilePath = await getPlayerFilePath(playerScript);

    const cachedSts = stsCache.get(playerFilePath);
    if (cachedSts) {
        res.setHeader('X-Cache-Hit', 'true');
        res.status(200).json({ sts: cachedSts });
        return;
    }

    const playerContent = await fs.readFile(playerFilePath, 'utf8');

    const stsPattern = /(signatureTimestamp|sts):(\d+)/;
    const match = playerContent.match(stsPattern);

    if (match && match[2]) {
        const sts = match[2];
        stsCache.set(playerFilePath, sts);
        res.setHeader('X-Cache-Hit', 'false');
        res.status(200).json({ sts });
    } else {
        res.status(404).json({ error: "Timestamp not found in player script" });
    }
});
