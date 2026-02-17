import { Router } from 'express';
import { acceptTerms, hasAcceptedTerms, TERMS_VERSION } from '../services/legal.service.js';

const router = Router();

// POST /api/legal/accept-terms
router.post('/accept-terms', async (req, res) => {
    try {
        const { userId, termsVersion } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        if (termsVersion !== TERMS_VERSION) {
            return res.status(400).json({ error: `Version mismatch. Server expects ${TERMS_VERSION}` });
        }

        // Obtener IP y User Agent
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const record = await acceptTerms(userId, ip, userAgent);

        res.json({
            success: true,
            recordedAt: record.accepted_at,
            version: record.terms_version
        });

    } catch (error) {
        console.error("Error accepting terms:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/legal/has-accepted-terms
router.get('/has-accepted-terms', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const accepted = await hasAcceptedTerms(userId);

        res.json({
            accepted,
            version: TERMS_VERSION,
            // Podríamos devolver fecha si accepted es true, pero require otra query o modificar service
            // Por ahora cumple el requerimiento básico
        });

    } catch (error) {
        console.error("Error checking terms status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
