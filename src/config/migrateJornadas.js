import db from "./database.js";

//
// Agregar columna estado a jornadas si no existe
//
db.run(
    `ALTER TABLE jornadas ADD COLUMN estado TEXT DEFAULT 'abierta'`,
    (err) => {

        if (err) {

            if (err.message.includes("duplicate column")) {

                console.log("Columna estado ya existe en jornadas");

            } else {

                console.log("Migración jornadas:", err.message);

            }

        } else {

            console.log("Columna estado agregada a jornadas");

        }

    }
);
