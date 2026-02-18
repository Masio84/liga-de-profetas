import express from "express";
import db from "../config/database.js";
import { requireAdminAuth } from "../middleware/auth.js";
import { syncResultados } from "../services/sync.service.js";
import { calcularPremios, buscarGanadores } from "../services/premios.service.js"; // Asegurar import correcto si existe
import { evaluarJornada } from "../services/evaluacion.service.js";

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
// RESUMEN DE JORNADAS (BULK)
// Evita hacer N peticiones desde el cliente
//
router.get("/jornadas/resumen", async (req, res) => {
    try {
        // 1. Obtener jornadas finalizadas
        const { rows: jornadas } = await db.query(
            `SELECT round as numero, status, MIN("startTime") as start 
             FROM matches 
             GROUP BY round, status 
             HAVING status = 'finished' 
             ORDER BY round DESC`
        );

        // NOTA: La lógica de estatus de jornada es compleja en 'jornadas.routes.js', 
        // pero aquí simplificamos: si todos los matches de una round están finished, la jornada es finished.
        // O mejor aún, reutilizamos la lógica de que el cliente ya sabe cuáles son finalizadas,
        // pero para ser robustos, el backend debería determinarlo.

        // Para no duplicar lógica compleja, asumiremos que el admin quiere ver el resumen de TODAS las jornadas que tengan algun partido.
        // O mejor: Iteramos sobre las jornadas que existen en la base de datos de matches.

        const { rows: rounds } = await db.query(`SELECT DISTINCT round FROM matches ORDER BY round DESC`);

        const resumen = [];

        // Ejecutamos secuencialmente para no matar la DB, pero es mucho más rápido que via HTTP
        for (const r of rounds) {
            try {
                // Usamos el servicio existente
                const evalData = await evaluarJornada(r.round);

                // Solo nos interesa si ya tiene ganadores o si ya terminó
                // Opcional: filtrar si no ha empezado.
                resumen.push(evalData);
            } catch (e) {
                console.error(`Error evaluando jornada ${r.round}:`, e.message);
                resumen.push({
                    jornada: r.round,
                    error: true
                });
            }
        }

        res.json({ resumen });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo resumen" });
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

        // 2. Obtener los pronósticos (JSONB)
        let pronosticosRaw = [];
        const { rows: jsonRows } = await db.query(`SELECT pronosticos FROM participaciones WHERE id = $1`, [id]);
        if (jsonRows.length > 0 && jsonRows[0].pronosticos) {
            // Manejar si viene como string JSON o ya como objeto
            if (typeof jsonRows[0].pronosticos === 'string') {
                try {
                    pronosticosRaw = JSON.parse(jsonRows[0].pronosticos);
                } catch (e) {
                    pronosticosRaw = [];
                }
            } else {
                pronosticosRaw = jsonRows[0].pronosticos;
            }
        }

        // 3. Obtener Partidos de esa Jornada para tener nombres reales
        const { rows: matches } = await db.query(
            `SELECT id, home_team as "homeTeam", away_team as "awayTeam", resultado, status 
             FROM matches WHERE round = $1`,
            [participacion.jornada]
        );

        // Map para búsqueda rápida de partido por ID
        const matchesMap = {};
        matches.forEach(m => matchesMap[m.id] = m);

        // 4. Enriquecer pronósticos con datos del partido
        const pronosticosEnriquecidos = pronosticosRaw.map(p => {
            // El ID puede venir como matchId o match_id
            const mId = p.matchId || p.match_id;
            const matchData = matchesMap[mId] || {};

            return {
                matchId: mId,
                local: matchData.homeTeam || "Desconocido",
                visitante: matchData.awayTeam || "Desconocido",
                seleccion: p.prediccion || p.seleccion || "N/A", // Unificar a 'seleccion' para frontend
                resultadoReal: matchData.resultado,
                status: matchData.status
            };
        });

        res.json({
            participacion: participacion,
            pronosticos: pronosticosEnriquecidos
        });

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
