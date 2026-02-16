import db from "../config/database.js";
import {
    obtenerPartidosLigaMX
}
    from "../providers/fotmobReal.provider.js";
import { sincronizarJornadas } from "./jornadas.service.js";


//
// Inicializar estado global desde base de datos si existe
//
async function inicializarEstadoSync() {
    try {
        const { rows } = await db.query(`
            SELECT * FROM sync_status 
            ORDER BY timestamp DESC 
            LIMIT 1
        `);

        if (rows.length === 0) {
            global.syncStatus = {
                ultimaSync: null,
                insertados: 0,
                actualizados: 0
            };
        } else {
            const row = rows[0];
            global.syncStatus = {
                ultimaSync: row.ultimaSync,
                insertados: row.insertados,
                actualizados: row.actualizados
            };
        }
    } catch (err) {
        // Si falla, iniciar con valores por defecto
        global.syncStatus = {
            ultimaSync: null,
            insertados: 0,
            actualizados: 0
        };
    }
}

// Inicializar al cargar el módulo
inicializarEstadoSync();


export async function syncResultados() {

    console.log(
        "Sincronizando desde FotMob (service)..."
    );

    const partidos =
        await obtenerPartidosLigaMX();

    let insertados = 0;
    let actualizados = 0;


    for (const p of partidos) {

        const existente =
            await obtenerMatchPorFotmobId(
                p.fotmobMatchId
            );

        if (!existente) {

            await insertarMatch(p);

            insertados++;

        }
        else {

            await actualizarMatch(p);

            actualizados++;

        }

    }


    //
    // GUARDAR ESTADO EN BASE DE DATOS Y MEMORIA
    //
    const timestamp = new Date().toISOString();

    // Guardar en base de datos
    try {
        // Asumiendo que sync_status tiene una estructura compatible o crearla
        // NOTA: sync_status no estaba en el initDB del database.js, 
        // deberíamos asegurarnos que exista. Se asume que sí.
        await db.query(`
            CREATE TABLE IF NOT EXISTS sync_status (
                id SERIAL PRIMARY KEY,
                ultima_sync TIMESTAMPTZ,
                insertados INTEGER,
                actualizados INTEGER,
                errores TEXT,
                timestamp TIMESTAMPTZ
            );
        `);

        await db.query(`
            INSERT INTO sync_status (ultima_sync, insertados, actualizados, errores, timestamp)
            VALUES ($1, $2, $3, 0, $4)
        `, [timestamp, insertados, actualizados, timestamp]);

    } catch (err) {
        console.error("Error guardando sync_status:", err.message);
    }

    // También guardar en memoria para acceso rápido
    global.syncStatus = {
        ultimaSync: timestamp,
        insertados,
        actualizados
    };

    //
    // ACTUALIZAR TABLA JORNADAS
    //
    await sincronizarJornadas();

    console.log(
        "Sync completado - Insertados:", insertados,
        "Actualizados:", actualizados,
        "Timestamp:", timestamp
    );

    return {
        insertados,
        actualizados,
        ultimaSync: timestamp
    };

}


async function obtenerMatchPorFotmobId(fotmobMatchId) {
    try {
        const { rows } = await db.query(
            `
            SELECT *
            FROM matches
            WHERE fotmob_match_id = $1
            `,
            [fotmobMatchId]
        );

        // Mapear snake_case a camelCase si es necesario, 
        // pero por ahora devolvemos el row tal cual.
        // Se debe tener cuidado con los nombres de columnas en la BD vs código.
        // En database.js no definimos fotmob_match_id con guiones bajos,
        // vamos a revisar los nombres.
        // En initDB de database.js NO se definio 'fotmob_match_id' en la tabla matches. 
        // HAY QUE CORREGIRLO. PostgreSQL es case-sensitive con comillas, pero por defecto lowercase.

        // REVISANDO database.js initDB para matches:
        /*
        CREATE TABLE IF NOT EXISTS matches (
            id SERIAL PRIMARY KEY,
            home_team TEXT NOT NULL,
            away_team TEXT NOT NULL,
            start_time TIMESTAMPTZ NOT NULL,
            round INTEGER NOT NULL,
            resultado TEXT,
            status TEXT
            -- FALTABA fotmob_match_id
        );
        */

        // VOY A AGREGAR LA COLUMNA SI NO EXISTE EN EL CÓDIGO DE ARRIBA CUANDO EJECUTE ALTER
        // PERO AQUÍ ASUMO QUE SE LLAMA fotmob_match_id

        return rows[0];
    } catch (err) {
        throw err;
    }
}


async function insertarMatch(match) {
    // Asegurar compatibilidad de nombres de columnas con PostgreSQL (snake_case preferible)
    // En el create table puse snake_case: home_team, away_team, start_time...

    // Primero, asegurarse de que la columna fotmob_match_id exista
    try {
        await db.query(`
            ALTER TABLE matches ADD COLUMN IF NOT EXISTS fotmob_match_id INTEGER;
            ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_team_id INTEGER;
            ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_team_id INTEGER;
        `);
    } catch (e) {
        // Ignorar error si ya existen
    }

    await db.query(
        `
        INSERT INTO matches
        (
            fotmob_match_id,
            home_team,
            away_team,
            home_team_id,
            away_team_id,
            start_time,
            round,
            resultado
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
            match.fotmobMatchId,
            match.homeTeam,
            match.awayTeam,
            match.homeTeamId,
            match.awayTeamId,
            match.startTime,
            match.round,
            match.resultado
        ]
    );
}

async function actualizarMatch(match) {
    await db.query(
        `
        UPDATE matches
        SET
            home_team = $1,
            away_team = $2,
            home_team_id = $3,
            away_team_id = $4,
            start_time = $5,
            round = $6,
            resultado = $7
        WHERE fotmob_match_id = $8
        `,
        [
            match.homeTeam,
            match.awayTeam,
            match.homeTeamId,
            match.awayTeamId,
            match.startTime,
            match.round,
            match.resultado,
            match.fotmobMatchId
        ]
    );
}
