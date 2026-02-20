import express from "express";
import db from "../config/database.js";
import { requireAdminAuth } from "../middleware/auth.js";
import { syncResultados } from "../services/sync.service.js";
import { calcularPremios } from "../services/premios.service.js"; // Asegurar import correcto si existe
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
// VERIFICAR TOKEN (Endpoint ligero)
//
router.get("/auth/verify", (req, res) => {
    res.json({ ok: true });
});

//
// OBTENER TODAS LAS PARTICIPACIONES
//
router.get("/participaciones", async (req, res) => {
    try {
        const jornadaFilter = req.query.jornada;
        let query = `
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
        `;

        const params = [];

        if (jornadaFilter) {
            query += ` WHERE p.jornada = $1`;
            params.push(jornadaFilter);
        } else {
            // Si no hay filtro, mostrar SOLO la jornada actual (o la última si no hay activa)
            // Para simplificar y cumplir el requerimiento de "limpieza", 
            // buscamos la jornada con el ID más alto registrada en participaciones o matches
            // O mejor: mostrar todo PERO ordenado por jornada DESC, 
            // o forzar que el frontend pida la jornada actual.
            // Opción elegida: Obtener la última jornada con participaciones si no se especifica
            /* 
               query += ` WHERE p.jornada = (SELECT MAX(jornada) FROM participaciones) `;
           */
            // El usuario pidió "el admin panel debe limitarse a participaciones de la jornada abierta"
            // Así que si no enviamos param, intentamos filtrar por la MAX jornada disponible o abierta.
            /* Sin embargo, para mayor control, dejaremos que el frontend decida qué jornada pedir (la activa),
               y si no pide nada, mostramos las de la jornada más reciente para no mostrar vacío. */
            query += ` WHERE p.jornada = (SELECT MAX(jornada) FROM participaciones) `; // Default to latest participation round
        }

        query += ` ORDER BY p.folio DESC, p.fecha DESC`;

        const { rows } = await db.query(query, params);

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
        // LIMITAMOS a las últimas 12 jornadas FINALIZADAS
        // Usamos la misma lógica que el index: Si MAX(start_time) ya pasó, la jornada se considera finalizada (o al menos jugada).
        // Agregamos un margen de 2 horas (120 min) para asegurar que los partidos terminaron.
        // NOW() devuelve UTC, start_time es timestamp with time zone (UTC).
        const { rows: rounds } = await db.query(`
            SELECT round 
            FROM matches 
            GROUP BY round 
            HAVING MAX(start_time) < (NOW() - INTERVAL '105 minutes') 
            ORDER BY round DESC 
            LIMIT 12
        `);

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
// VALIDAR / INVALIDAR / REACTIVAR
//
router.post("/participaciones/:id/:action", async (req, res) => {
    const { id, action } = req.params;
    // action: 'validar', 'invalidar', 'desactivar', 'reactivar'

    try {
        let query = "";
        let params = [id];

        if (action === "validar") {
            query = "UPDATE participaciones SET validada = 1, activa = 1 WHERE id = $1";
        } else if (action === "invalidar") {
            query = "UPDATE participaciones SET validada = 0 WHERE id = $1";
        } else if (action === "desactivar") {
            query = "UPDATE participaciones SET activa = 0 WHERE id = $1"; // Soft delete
        } else if (action === "reactivar") {
            query = "UPDATE participaciones SET activa = 1 WHERE id = $1";
        } else {
            return res.status(400).json({ error: "Acción no válida" });
        }

        await db.query(query, params);
        res.json({ success: true, action });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error actualizando estado" });
    }
});

//
// OBTENER GANADORES DETALLADOS DE UNA JORNADA
//
router.get("/premios/:jornada", async (req, res) => {
    try {
        const jornada = req.params.jornada;
        const resultado = await calcularPremios(jornada);
        res.json(resultado);
    } catch (error) {
        console.error("Error calculando premios:", error);
        res.status(500).json({ error: "Error calculando premios" });
    }
});

export default router;
