import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeCache } from './src/playerCache.js';

// Import handlers
import decryptSignatureHandler from './api/decrypt_signature.js';
import getStsHandler from './api/get_sts.js';
import resolveUrlHandler from './api/resolve_url.js';
import metricsHandler from './api/metrics.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Routes mapped to match Vercel & Deno endpoints
app.post('/decrypt_signature', decryptSignatureHandler as any);
app.post('/get_sts', getStsHandler as any);
app.post('/resolve_url', resolveUrlHandler as any);
app.get('/metrics', metricsHandler as any);

// Serve static documentation files from public
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for missing Swagger/HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 8001;
const host = process.env.HOST || '0.0.0.0';

async function start() {
    await initializeCache();
    app.listen(Number(port), host, () => {
        console.log(`Server listening locally at http://${host}:${port}`);
    });
}

start().catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
