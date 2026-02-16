import express from "express";
import db from "../config/database.js";
import { calcularPremios } from "../utils/premios.js";

const router = express.Router();


//
// Obtener todas las jornadas con estado automático
//
router.get("/", (req, res) => {

    const ahora =
        new Date().toISOString();

    db.all(
        `
        SELECT
            round as numero,
            MIN(startTime) as fechaInicio,
            MAX(startTime) as fechaFin
        FROM matches
        GROUP BY round
        ORDER BY round DESC
        `,
        [],
        (err, jornadas) => {

            if (err) {

                return res.status(500)
                .json({
                    error: err.message
                });

            }

            const jornadasConEstado =
                jornadas.map(j => {

                    let estado =
                        "DISPONIBLE";

                    if (ahora >= j.fechaInicio &&
                        ahora <= j.fechaFin) {

                        estado =
                        "EN_CURSO";

                    }

                    if (ahora > j.fechaFin) {

                        estado =
                        "FINALIZADA";

                    }

                    return {

                        numero:
                            j.numero,

                        fechaInicio:
                            j.fechaInicio,

                        fechaFin:
                            j.fechaFin,

                        estado

                    };

                });

            res.json({

                jornadas:
                    jornadasConEstado

            });

        }
    );

});


//
// Obtener matches de jornada específica
//
router.get("/:numero/matches", (req, res) => {

    const numero =
        parseInt(req.params.numero);

    db.all(
        `
        SELECT *
        FROM matches
        WHERE round = ?
        ORDER BY startTime ASC
        `,
        [numero],
        (err, rows) => {

            if (err) {

                return res.status(500)
                .json({
                    error: err.message
                });

            }

            res.json({

                jornada:
                    numero,

                total:
                    rows.length,

                matches:
                    rows

            });

        }
    );

});


//
// Obtener pozo acumulado de jornada específica
//
router.get("/:numero/pozo", (req, res) => {

    const numero =
        parseInt(req.params.numero);

    db.get(
        `
        SELECT
            SUM(monto) as pozo
        FROM participaciones
        WHERE jornada = ?
        AND activa = 1
        AND validada = 1
        `,
        [numero],
        (err, row) => {

            if (err) {

                return res.status(500)
                .json({
                    error: err.message
                });

            }

            const pozo = row?.pozo || 0;
            const premios = calcularPremios(pozo);

            res.json({

                jornada: numero,
                pozo: pozo,
                premios: premios

            });

        }
    );

});

export default router;
