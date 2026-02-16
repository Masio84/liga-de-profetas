import db from './src/config/database.js';

const sql = `
    SELECT round, COUNT(*) as partidos, MIN(startTime) as inicio, MAX(startTime) as fin
    FROM matches
    WHERE round >= 6 AND round <= 20
    GROUP BY round
    ORDER BY round ASC
`;

db.all(sql, [], (err, rows) => {
    if (err) console.error(err);
    else {
        console.log("Current Time:", new Date().toISOString());
        console.table(rows);
    }
});
