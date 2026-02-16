import db from './src/config/database.js';

db.all("SELECT count(*) as count FROM matches", (err, rows) => {
    console.log("Matches count:", rows[0].count);
});

db.all("SELECT count(*) as count FROM participaciones", (err, rows) => {
    console.log("Participaciones count:", rows[0].count);
});

db.all("SELECT * FROM jornadas", (err, rows) => {
    console.log("Jornadas:", rows);
});
