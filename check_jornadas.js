import db from './src/config/database.js';

db.all("SELECT * FROM jornadas ORDER BY numero ASC", (err, rows) => {
    console.log("Jornadas found:", rows.length);
    if (rows.length > 0) {
        console.log("First 3 jornadas:", rows.slice(0, 3));
    }
});
