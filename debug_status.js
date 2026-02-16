import db from './src/config/database.js';

const ahora = new Date().toISOString();

db.all("SELECT * FROM jornadas ORDER BY numero ASC", (err, jornadas) => {
    if (err) {
        console.error(err);
        return;
    }

    const jornadasConEstado = jornadas.map(j => {
        let estado = "PROXIMA";
        if (j.fechaFin < ahora) {
            estado = "FINALIZADA";
        } else if (j.fechaInicio <= ahora && j.fechaFin >= ahora) {
            estado = "EN_CURSO";
        } else if (j.fechaInicio > ahora) {
            estado = "DISPONIBLE"; // This seems too simple? Multiple can be DISPONIBLE
        }
        return { ...j, estado };
    });

    console.log("Jornadas con estado simulado:");
    console.table(jornadasConEstado.filter(j => j.numero >= 6 && j.numero <= 18));
});
