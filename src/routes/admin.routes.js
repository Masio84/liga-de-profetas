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
// OBTENER TODAS LAS PARTICIPACIONES
//
router.get("/participaciones", async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT 
                p.id,
                p.usuario_id,
                u.nombre as usuario,
                u.celular,
                p.jornada,
                p.monto,
                p.pronosticos,
                p.fecha,
                p.activa,
                p.validada,
                p.referencia_pago as "referenciaPago",
                p.folio
            FROM participaciones p
            JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.fecha DESC
        `);

        res.json({ participaciones: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo participaciones" });
    }
});

//
// OBTENER DETALLE PARTICIPACION (PARA MODAL)
//
router.get("/participaciones/:id", async (req, res) => {
    const id = req.params.id;
    try {
        // 1. Obtener la participación
        const { rows: pRows } = await db.query(`
            SELECT 
                p.id,
                p.usuario_id,
                u.nombre as usuario,
                u.celular,
                p.jornada,
                p.monto,
                p.fecha,
                p.activa,
                p.validada,
                p.referencia_pago as "referenciaPago",
                p.folio
            FROM participaciones p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = $1
        `, [id]);

        if (pRows.length === 0) {
            return res.status(404).json({ error: "Participación no encontrada" });
        }
        const participacion = pRows[0];

        // 2. Obtener los pronósticos
        // Asumimos que están en una tabla 'pronosticos' o en un campo jsonb 'pronosticos' en la tabla participaciones
        // Basado en el código de 'crearParticipacion' (no visible pero inferido), y la consulta anterior que tenía p.pronosticos
        // Si p.pronosticos existe en la tabla participaciones como JSONB:
        let pronosticos = [];
        const { rows: jsonRows } = await db.query(`SELECT pronosticos FROM participaciones WHERE id = $1`, [id]);
        if (jsonRows.length > 0 && jsonRows[0].pronosticos) {
            pronosticos = jsonRows[0].pronosticos;
        }

        res.json({ participaciones: participacion, participacion: participacion, pronosticos });
        // Nota: enviamos 'participacion' singular para el frontend, y manteniendo compatibilidad si se usa plural.

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo detalles" });
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
