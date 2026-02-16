import express from "express";
import db from "../config/database.js";
import { evaluarJornada } from "../services/evaluacion.service.js";

const router = express.Router();

//
// Evaluar jornada actual automáticamente
//
//
// Evaluar jornada actual automáticamente
//
router.get("/actual", async (req, res) => {

    try {

        // En PostgreSQL usamos LIMIT 1, pero la consulta es standard.
        // Asumimos que "estado" y "numero" son columnas válidas.
        // OJO: "estado" no existe en la tabla jornadas (según esquema previo),
        // el estado se calcula dinámicamente en jornadas.routes.js.
        // Pero si existiera, la query sería:
        const { rows } = await db.query(
            "SELECT round as numero FROM matches GROUP BY round ORDER BY MIN(startTime) DESC LIMIT 1"
        );
        // NOTA: La lógica original buscaba "estado = 'abierta'".
        // Pero en jornadas.routes.js vimos que el estado es calculado.
        // Voy a usar una lógica aproximada: La última jornada con partidos.
        // O mejor, invocar evaluarJornada con la jornada actual calculada por fecha.

        // Mejor enfoque: Calcular jornada actual basada en fecha, similar a jornadas.routes.js
        const ahora = new Date().toISOString();
        const { rows: matches } = await db.query(`
            SELECT round, MIN("startTime") as start, MAX("startTime") as end
            FROM matches
            GROUP BY round
        `);

        const jornadaAbierta = matches.find(m =>
            ahora >= new Date(m.start).toISOString() &&
            ahora <= new Date(m.end).toISOString()
        );

        if (!jornadaAbierta) {
            return res.status(404).json({ error: "No hay jornada abierta (en curso) actualmente" });
        }

        const resultado = await evaluarJornada(jornadaAbierta.round);
        res.json(resultado);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }

});

//
// Evaluar jornada específica
//
router.get("/:jornada", async (req, res) => {

    try {

        const jornada = parseInt(req.params.jornada);

        if (isNaN(jornada)) {

            return res.status(400).json({
                error: "Jornada inválida"
            });

        }

        const resultado = await evaluarJornada(jornada);

        res.json(resultado);

    } catch (e) {

        res.status(500).json({
            error: e.message
        });

    }

});

export default router;
