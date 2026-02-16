import db from "./database.js";

//
// Agregar columna resultado si no existe
//
db.run(`
ALTER TABLE matches ADD COLUMN resultado TEXT
`, (err) => {

    if (err) {

        if (err.message.includes("duplicate column")) {

            console.log("Columna resultado ya existe");

        } else {

            console.log("Migración:", err.message);

        }

    } else {

        console.log("Columna resultado agregada correctamente");

    }

});
