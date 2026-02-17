import express from "express";
import { syncResultados } from "../services/sync.service.js";

const router = express.Router();

// Endpoint para el Cron Job de Vercel
router.get("/sync", async (req, res) => {
    // Verificación de seguridad básica (opcional, Vercel firma los requests)
    // const authHeader = req.headers['authorization'];
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    console.log("[CRON] Ejecutando sincronización programada...");

    try {
        const resultado = await syncResultados();
        console.log("[CRON] Sincronización exitosa:", resultado);
        res.status(200).json({ success: true, ...resultado });
    } catch (error) {
        console.error("[CRON] Error en sincronización:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
