import db from "./src/config/database.js";

db.all("PRAGMA table_info(matches)", (err, rows) => {
    if (err) console.error(err);
    console.log("Schema matches:");
    console.table(rows);
});

db.all("SELECT homeTeam, homeTeamId FROM matches LIMIT 20", (err, rows) => {
    console.log("Teams sample:");
    console.table(rows);
});
