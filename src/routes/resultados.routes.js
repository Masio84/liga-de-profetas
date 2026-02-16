import express from "express";
import db from "../config/database.js";

const router = express.Router();

//
// VER TODOS LOS RESULTADOS
//
router.get("/", async (req, res) => {

    try {
        const { rows } = await db.query("SELECT * FROM matches");
        res.json({ matches: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

//
// REGISTRAR RESULTADO
//
router.post("/", async (req, res) => {

    const { matchId, resultado } = req.body;

    if (!matchId || !resultado) {
        return res.status(400).json({
            error: "Datos incompletos"
        });
    }

    try {
        await db.query(
            "UPDATE matches SET resultado = $1 WHERE id = $2",
            [resultado, matchId]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

export default router;
