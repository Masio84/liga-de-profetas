import db from "./database.js";

db.run(
    `ALTER TABLE participaciones ADD COLUMN validada INTEGER DEFAULT 0`,
    (err) => {

        if (err) {

            if (err.message.includes("duplicate column")) {

                console.log("Columna validada ya existe");

            } else {

                console.log(err.message);

            }

        } else {

            console.log("Columna validada agregada");

        }

    }
);
