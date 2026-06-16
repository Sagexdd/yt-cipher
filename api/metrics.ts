import type { VercelRequest, VercelResponse } from '@vercel/node';
import { registry } from '../src/metrics.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        res.setHeader('Content-Type', registry.contentType);
        res.send(await registry.metrics());
    } catch (err: any) {
        res.status(500).end(err.message);
    }
}
