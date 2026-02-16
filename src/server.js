import app from "./app.js";
import "./config/database.js";
// import "./config/initDatabase.js";
// import "./config/migrate.js";
// import "./config/migrateJornadas.js";
// import "./config/migrateParticipaciones.js";
// import "./config/migrateValidacion.js";
// import "./config/migrateTeamIds.js";
// import "./config/migrateSyncStatus.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Liga de Profetas backend corriendo en http://localhost:${PORT}`);

});
