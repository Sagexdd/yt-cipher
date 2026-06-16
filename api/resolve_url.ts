import type { VercelRequest, VercelResponse } from '@vercel/node';
import { wrapHandler } from '../src/middleware.js';
import { getSolvers } from '../src/solver.js';

export default wrapHandler(async (req: VercelRequest, res: VercelResponse, playerScript: any) => {
    const { stream_url, encrypted_signature, signature_key, n_param: nParamFromRequest } = req.body;

    const solvers = await getSolvers(playerScript);
    if (!solvers) {
        res.status(500).json({ error: "Failed to generate solvers from player script" });
        return;
    }

    const url = new URL(stream_url);

    if (encrypted_signature) {
        if (!solvers.sig) {
            res.status(500).json({ error: "No signature solver found for this player" });
            return;
        }
        const decryptedSig = solvers.sig(encrypted_signature);
        const sigKey = signature_key || url.searchParams.get("sp") || 'sig';
        url.searchParams.set(sigKey, decryptedSig);
        url.searchParams.delete("s");
    }

    let nParam = nParamFromRequest || null;
    if (!nParam) {
        nParam = url.searchParams.get("n");
    }

    if (solvers.n && nParam) {
        const decryptedN = solvers.n(nParam);
        url.searchParams.set("n", decryptedN);
    }
    
    res.status(200).json({
        resolved_url: url.toString(),
    });
});
