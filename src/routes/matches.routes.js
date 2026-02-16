import { Router } from "express";
import db from "../config/database.js";

const router = Router();

//
// GET todos los matches
//
router.get("/", async (req, res) => {

    try {
        const sql = `
            SELECT
                id,
                home_team as user_homeTeam, -- Alias para mantener compatibilidad con frontend si es necesario
                away_team as user_awayTeam,
                home_team_id as user_homeTeamId,
                away_team_id as user_awayTeamId,
                start_time as user_startTime,
                round,
                resultado,
                fotmob_match_id as user_fotmobMatchId
            FROM matches
            ORDER BY start_time ASC
        `;

        const { rows } = await db.query(sql);

        // Mapeo manual para asegurar compatibilidad camelCase con frontend
        const matches = rows.map(m => ({
            id: m.id,
            homeTeam: m.user_homeTeam || m.home_team,
            awayTeam: m.user_awayTeam || m.away_team,
            homeTeamId: m.user_homeTeamId || m.home_team_id,
            awayTeamId: m.user_awayTeamId || m.away_team_id,
            startTime: m.user_startTime || m.start_time,
            round: m.round,
            resultado: m.resultado,
            fotmobMatchId: m.user_fotmobMatchId || m.fotmob_match_id
        }));

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

    const numero = parseInt(req.params.numero);

    try {
        const sql = `
            SELECT
                id,
                home_team,
                away_team,
                home_team_id,
                away_team_id,
                start_time,
                round,
                resultado,
                fotmob_match_id
            FROM matches
            WHERE round = $1
            ORDER BY start_time ASC
        `;

        const { rows } = await db.query(sql, [numero]);

        // Mapeo camelCase
        const matches = rows.map(m => ({
            id: m.id,
            homeTeam: m.home_team,
            awayTeam: m.away_team,
            homeTeamId: m.home_team_id,
            awayTeamId: m.away_team_id,
            startTime: m.start_time,
            round: m.round,
            resultado: m.resultado,
            fotmobMatchId: m.fotmob_match_id
        }));

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
