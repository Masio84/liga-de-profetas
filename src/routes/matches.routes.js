import { Router } from "express";
import db from "../config/database.js";

const router = Router();

//
// GET todos los matches
//
router.get("/", async (req, res) => {

    // CACHE: 60 segundos
    res.set('Cache-Control', 'public, max-age=60, s-maxage=60');

    try {
        const sql = `
            SELECT
                id,
                home_team as "homeTeam",
                away_team as "awayTeam",
                home_team_id as "homeTeamId",
                away_team_id as "awayTeamId",
                start_time as "startTime",
                round,
                resultado,
                fotmob_match_id as "fotmobMatchId"
            FROM matches
            ORDER BY start_time ASC
        `;

        const { rows } = await db.query(sql);

        // Ya vienen en camelCase desde la query
        const matches = rows;

        res.json({
            total: matches.length,
            matches
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

//
// GET matches por jornada
//
router.get("/jornada/:numero", async (req, res) => {

    // CACHE: 60 segundos
    res.set('Cache-Control', 'public, max-age=60, s-maxage=60');

    const numero = parseInt(req.params.numero);

    try {
        const sql = `
            SELECT
                id,
                home_team as "homeTeam",
                away_team as "awayTeam",
                home_team_id as "homeTeamId",
                away_team_id as "awayTeamId",
                start_time as "startTime",
                round,
                resultado,
                fotmob_match_id as "fotmobMatchId"
            FROM matches
            WHERE round = $1
            ORDER BY start_time ASC
        `;

        const { rows } = await db.query(sql, [numero]);

        const matches = rows;

        res.json({
            jornada: numero,
            total: matches.length,
            matches
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

export default router;
