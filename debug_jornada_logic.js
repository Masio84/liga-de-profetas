import db from './src/config/database.js';

const ahora = new Date().toISOString();
console.log("Fecha referencia (ahora):", ahora);

const sql = `
    SELECT round, MIN(startTime) as primerPartido
    FROM matches
    GROUP BY round
    HAVING primerPartido > ?
    ORDER BY round ASC
    LIMIT 1
`;

db.get(sql, [ahora], (err, row) => {
    if (err) console.error(err);
    else console.log("Jornada seleccionada por query original:", row);
});

// Query alternativa: próxima jornada no finalizada
const sql2 = `
    SELECT round, MIN(startTime) as primerPartido
    FROM matches
    WHERE round >= (
        SELECT round FROM matches WHERE startTime <= ? ORDER BY startTime DESC LIMIT 1
    )
    GROUP BY round
    HAVING primerPartido > ?
    ORDER BY round ASC
    LIMIT 1
`;

// db.get(sql2, [ahora, ahora], (err, row) => console.log("Jornada seleccionada por query 2:", row));
