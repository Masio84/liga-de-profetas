import db from "./database.js";

//
// CREAR COLUMNA fotmobMatchId SI NO EXISTE
//
db.run(`
    ALTER TABLE matches ADD COLUMN fotmobMatchId INTEGER
`, err => {
    if (err && !err.message.includes("duplicate column")) {
        console.error("Error agregando fotmobMatchId:", err.message);
    }
});


//
// NOTA: Los datos iniciales (jornadas y matches) se crearán automáticamente
// cuando se ejecute la sincronización desde FotMob.
// No se crean datos de prueba aquí para evitar confusión.
//
