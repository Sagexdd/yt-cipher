import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlayerScript } from './player.js';
import { endpointHits, responseCodes, endpointLatency } from './metrics.js';

export function wrapHandler(handler: (req: VercelRequest, res: VercelResponse, playerScript: any) => Promise<void>) {
    return async (req: VercelRequest, res: VercelResponse) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Plugin-Version');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // 1. Authentication
        const API_TOKEN = process.env.API_TOKEN;
        const authHeader = req.headers.authorization;
        if (API_TOKEN && API_TOKEN !== "") {
            if (authHeader !== API_TOKEN) {
                const error = authHeader ? 'Invalid API token' : 'Missing API token';
                res.status(401).json({ error });
                return;
            }
        }

        // 2. Parse and Validate playerScript
        let playerScript: any = null;
        const body = req.body || {};
        const pathname = req.url?.split('?')[0] || "unknown";

        // Validate body fields depending on the endpoint path
        const errors: string[] = [];
        if (pathname === '/decrypt_signature' || pathname === '/get_sts' || pathname === '/resolve_url') {
            if (!body.player_url || typeof body.player_url !== 'string') {
                errors.push("'player_url' is missing or invalid");
            }
        }
        if (pathname === '/resolve_url') {
            if (!body.stream_url || typeof body.stream_url !== 'string') {
                errors.push("'stream_url' is missing or invalid");
            }
        }

        if (errors.length > 0) {
            res.status(400).json({ error: `Invalid request body: ${errors.join(', ')}` });
            return;
        }

        if (body.player_url) {
            try {
                playerScript = getPlayerScript(body.player_url);
            } catch (e: any) {
                res.status(400).json({ error: `Player script error: ${e.message}` });
                return;
            }
        }

        // 3. Track metrics
        const playerId = playerScript?.id ?? "unknown";
        const playerType = playerScript?.variant ?? "unknown";
        const pluginVersion = (req.headers['plugin-version'] as string) ?? "unknown";
        const userAgent = (req.headers['user-agent'] as string) ?? "unknown";

        endpointHits.labels({
            method: req.method || "POST",
            pathname,
            player_id: playerId,
            player_type: playerType,
            plugin_version: pluginVersion,
            user_agent: userAgent
        }).inc();

        const start = performance.now();

        try {
            await handler(req, res, playerScript);
            
            const duration = (performance.now() - start) / 1000;
            const cachedHeader = res.getHeader('X-Cache-Hit');
            const cached = cachedHeader === 'true' ? 'true' : 'false';
            endpointLatency.labels({
                method: req.method || "POST",
                pathname,
                player_id: playerId,
                player_type: playerType,
                cached
            }).observe(duration);

            responseCodes.labels({
                method: req.method || "POST",
                pathname,
                status: String(res.statusCode),
                player_id: playerId,
                player_type: playerType,
                plugin_version: pluginVersion,
                user_agent: userAgent
            }).inc();
        } catch (e: any) {
            console.error("Error executing handler:", e);
            const message = e instanceof Error ? e.message : String(e);
            if (!res.writableEnded) {
                res.status(500).json({ error: message });
            }
            responseCodes.labels({
                method: req.method || "POST",
                pathname,
                status: "500",
                player_id: playerId,
                player_type: playerType,
                plugin_version: pluginVersion,
                user_agent: userAgent
            }).inc();
        }
    };
}
