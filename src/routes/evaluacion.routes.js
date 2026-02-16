import express from "express";
import db from "../config/database.js";
import { evaluarJornada } from "../services/evaluacion.service.js";

const router = express.Router();

//
// Evaluar jornada actual automáticamente
//
router.get("/actual", async (req, res) => {

    try {

        db.get(
            "SELECT numero FROM jornadas WHERE estado = 'abierta' LIMIT 1",
            [],
            async (err, row) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }

                if (!row) {

                    return res.status(404).json({
                        error: "No hay jornada abierta"
                    });

                }

                const resultado = await evaluarJornada(row.numero);

                res.json(resultado);

            }
        );

    } catch (e) {

        res.status(500).json({
            error: e.message
        });

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
