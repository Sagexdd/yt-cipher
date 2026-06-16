import type { VercelRequest, VercelResponse } from '@vercel/node';
import { wrapHandler } from '../src/middleware.js';
import { getSolvers } from '../src/solver.js';

export default wrapHandler(async (req: VercelRequest, res: VercelResponse, playerScript: any) => {
    const { encrypted_signature, n_param } = req.body;

    const solvers = await getSolvers(playerScript);

    if (!solvers) {
        res.status(500).json({ error: "Failed to generate solvers from player script" });
        return;
    }

    let decrypted_signature = '';
    if (encrypted_signature && solvers.sig) {
        decrypted_signature = solvers.sig(encrypted_signature);
    }

    let decrypted_n_sig = '';
    if (n_param && solvers.n) {
        decrypted_n_sig = solvers.n(n_param);
    }

    res.status(200).json({
        decrypted_signature,
        decrypted_n_sig,
    });
});
