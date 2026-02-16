import db from "./database.js";

//
// Agregar columnas homeTeamId y awayTeamId si no existen
//
db.run(`
    ALTER TABLE matches ADD COLUMN homeTeamId INTEGER
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.error("Error agregando homeTeamId:", err.message);
    } else if (!err) {
        console.log("Columna homeTeamId agregada correctamente");
    }
});

db.run(`
    ALTER TABLE matches ADD COLUMN awayTeamId INTEGER
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.error("Error agregando awayTeamId:", err.message);
    } else if (!err) {
        console.log("Columna awayTeamId agregada correctamente");
    }
});
