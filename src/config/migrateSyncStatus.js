import db from "./database.js";

//
// Crear tabla para estado de sync persistente
//
db.run(`
    CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ultimaSync TEXT,
        insertados INTEGER DEFAULT 0,
        actualizados INTEGER DEFAULT 0,
        errores INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL
    )
`, (err) => {
    if (err) {
        console.error("Error creando tabla sync_status:", err.message);
    } else {
        console.log("Tabla sync_status lista");
    }
});
