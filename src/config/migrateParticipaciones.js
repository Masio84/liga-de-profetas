import db from "./database.js";

db.run(
    `ALTER TABLE participaciones ADD COLUMN activa INTEGER DEFAULT 1`,
    (err) => {

        if (err) {

            if (err.message.includes("duplicate column")) {

                console.log("Columna activa ya existe");

            } else {

                console.log(err.message);

            }

        } else {

            console.log("Columna activa agregada");

        }

    }
);
