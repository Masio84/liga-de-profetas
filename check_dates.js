import db from "./src/config/database.js";

db.all("SELECT id, round, homeTeam, awayTeam, startTime FROM matches WHERE round = 7 ORDER BY startTime", [], (err, rows) => {
    if (err) console.error(err);
    console.log("Jornada 7 Matches:");
    console.table(rows);
});
