import express from "express";
import db from "../config/database.js";
import { requireAdminAuth } from "../middleware/auth.js";
import { syncResultados } from "../services/sync.service.js";
import { calcularPremios } from "../services/premios.service.js";

const router = express.Router();

// Aplicar autenticación a todas las rutas admin
router.use(requireAdminAuth);

//
// SINCRONIZAR RESULTADOS DESDE FOTMOB
//
router.post("/sync/resultados", async (req, res) => {

    try {
        const resultado = await syncResultados();
        console.log("Sync completa:", resultado);
        res.json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error sincronizando resultados"
        });
    }

});

//
// VALIDAR PARTICIPACION
//
router.post("/participaciones/:id/validar", async (req, res) => {

    const id = req.params.id;

    try {
        await db.query(
            `UPDATE participaciones SET validada = 1 WHERE id = $1`,
            [id]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

//
// INVALIDAR
//
router.post("/participaciones/:id/invalidar", async (req, res) => {

    const id = req.params.id;

    try {
        await db.query(
            `UPDATE participaciones SET validada = 0 WHERE id = $1`,
            [id]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

//
// DESACTIVAR
//
router.post("/participaciones/:id/desactivar", async (req, res) => {

    const id = req.params.id;

    try {
        await db.query(
            `UPDATE participaciones SET activa = 0 WHERE id = $1`,
            [id]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

//
// REACTIVAR
//
router.post("/participaciones/:id/reactivar", async (req, res) => {

    const id = req.params.id;

    try {
        await db.query(
            `UPDATE participaciones SET activa = 1 WHERE id = $1`,
            [id]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

//
// CALCULAR PREMIOS
//
router.get("/premios/:jornada", async (req, res) => {
    try {
        const jornada = parseInt(req.params.jornada);
        const resultado = await calcularPremios(jornada);
        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error calculando premios"
        });
    }
});

export default router;
