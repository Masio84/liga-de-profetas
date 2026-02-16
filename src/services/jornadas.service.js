import db from "../config/database.js";

//
// Obtener jornada disponible para participar
//
// Regla:
// Es la jornada cuyo primer partido aún no inicia
//
export async function obtenerJornadaDisponible() {
    try {
        const sql = `
            SELECT round, MIN(start_time) as primer_partido
            FROM matches
            GROUP BY round
            HAVING MIN(start_time) > NOW()
            ORDER BY round ASC
            LIMIT 1
        `;

        const { rows } = await db.query(sql);

        if (rows.length === 0) return null;

        return {
            numero: rows[0].round,
            startTime: rows[0].primer_partido,
            estado: "DISPONIBLE"
        };
    } catch (err) {
        throw err;
    }
}

//
// Obtener jornada en curso
//
// Regla:
// Ya inició al menos un partido
// pero no todos tienen resultado
//
export async function obtenerJornadaEnCurso() {
    try {
        const sql = `
            SELECT DISTINCT round
            FROM matches
            WHERE start_time <= NOW()
            AND round NOT IN (
                SELECT round
                FROM matches
                GROUP BY round
                HAVING COUNT(*) = SUM(
                    CASE WHEN resultado IS NOT NULL THEN 1 ELSE 0 END
                )
            )
            ORDER BY round ASC
            LIMIT 1
        `;

        const { rows } = await db.query(sql);

        if (rows.length === 0) return null;

        return {
            numero: rows[0].round,
            estado: "EN_CURSO"
        };
    } catch (err) {
        throw err;
    }
}

//
// Obtener jornada finalizada más reciente
//
export async function obtenerJornadaFinalizada() {
    try {
        const sql = `
            SELECT round
            FROM matches
            GROUP BY round
            HAVING COUNT(*) = SUM(
                CASE WHEN resultado IS NOT NULL THEN 1 ELSE 0 END
            )
            ORDER BY round DESC
            LIMIT 1
        `;

        const { rows } = await db.query(sql);

        if (rows.length === 0) return null;

        return {
            numero: rows[0].round,
            estado: "FINALIZADA"
        };
    } catch (err) {
        throw err;
    }
}

//
// Obtener estado completo del sistema
//
export async function obtenerEstadoJornadas() {
    const disponible = await obtenerJornadaDisponible();
    const enCurso = await obtenerJornadaEnCurso();
    const finalizada = await obtenerJornadaFinalizada();

    return {
        disponible,
        enCurso,
        finalizada
    };
}

//
// Verificar si una jornada acepta participaciones
//
export async function jornadaAceptaParticipaciones(numeroJornada) {
    try {
        const sql = `
            SELECT MIN(start_time) as primer_partido
            FROM matches
            WHERE round = $1
        `;

        const { rows } = await db.query(sql, [numeroJornada]);

        if (rows.length === 0 || !rows[0].primer_partido) {
            return false;
        }

        const ahora = new Date();
        return new Date(rows[0].primer_partido) > ahora;
    } catch (err) {
        throw err;
    }
}

//
// Sincronizar tabla jornadas con matches
//
export async function sincronizarJornadas() {
    try {
        // Obtener todas las jornadas únicas de matches
        const { rows: jornadasMatches } = await db.query(`
            SELECT 
                round as numero,
                MIN(start_time) as fecha_inicio,
                MAX(start_time) as fecha_fin
            FROM matches
            WHERE round IS NOT NULL
            GROUP BY round
        `);

        // Para cada jornada, insertar o actualizar en tabla jornadas
        let procesadas = 0;

        for (const j of jornadasMatches) {
            // Upsert (Insertar o Actualizar si existe)
            // PostgreSQL tiene ON CONFLICT para esto
            await db.query(`
                INSERT INTO jornadas (numero, fecha_inicio, fecha_fin)
                VALUES ($1, $2, $3)
                ON CONFLICT (numero) 
                DO UPDATE SET 
                    fecha_inicio = EXCLUDED.fecha_inicio,
                    fecha_fin = EXCLUDED.fecha_fin
            `, [j.numero, j.fecha_inicio, j.fecha_fin]);

            procesadas++;
        }

        return { procesadas };
    } catch (err) {
        throw err;
    }
}
