import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

import matchesRoutes from "./routes/matches.routes.js";
import jornadasRoutes from "./routes/jornadas.routes.js";
import participacionesRoutes from "./routes/participaciones.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import resultadosRoutes from "./routes/resultados.routes.js";
import evaluacionRoutes from "./routes/evaluacion.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import syncRoutes from "./routes/sync.routes.js";

import { syncResultados }
from "./services/sync.service.js";


const app = express();


//
// Necesario para rutas absolutas
//
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//
// Middleware
//
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));
app.use(express.json());


//
// Servir frontend
//
app.use(
express.static(
path.join(__dirname, "Frontend")
)
);


//
// API routes públicas
//
app.use("/api/matches", matchesRoutes);

app.use("/api/jornadas", jornadasRoutes);

app.use("/api/participaciones", participacionesRoutes);

app.use("/api/usuarios", usuariosRoutes);

app.use("/api/resultados", resultadosRoutes);

app.use("/api/evaluacion", evaluacionRoutes);


//
// API routes administrativas
//
app.use("/api/admin", adminRoutes);

app.use("/api/admin/sync", syncRoutes);


//
// Health check
//
app.get("/api/health", (req, res) => {

    res.json({

        status: "ok",

        service: "liga-de-profetas-backend",

        timestamp:
        new Date().toISOString()

    });

});


//
// Root
//
app.get("/", (req, res) => {

    res.send(
        "Liga de Profetas backend activo ⚽"
    );

});


//
// FUNCIÓN DE AUTO SYNC CON MANEJO ROBUSTO DE ERRORES
//
let syncEnProgreso = false;
let ultimoError = null;
let contadorErroresConsecutivos = 0;
const MAX_ERRORES_CONSECUTIVOS = 5;
const INTERVALO_SYNC = parseInt(process.env.SYNC_INTERVAL_MS || "300000"); // 5 minutos por defecto
const TIMEOUT_SYNC = parseInt(process.env.SYNC_TIMEOUT_MS || "60000"); // 60 segundos timeout

async function ejecutarAutoSync() {

    // Evitar ejecuciones concurrentes
    if (syncEnProgreso) {
        console.log("Sync ya en progreso, omitiendo...");
        return;
    }

    syncEnProgreso = true;

    try {

        console.log("Auto-sync FotMob iniciado...");

        // Timeout para evitar que se quede colgado
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout en sync")), TIMEOUT_SYNC);
        });

        const syncPromise = syncResultados();

        const resultado = await Promise.race([syncPromise, timeoutPromise]);

        console.log("Auto-sync FotMob completo:", resultado);

        // Resetear contador de errores si fue exitoso
        contadorErroresConsecutivos = 0;
        ultimoError = null;

    }
    catch (error) {

        contadorErroresConsecutivos++;
        ultimoError = {
            mensaje: error.message,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };

        console.error(`Error en auto-sync (${contadorErroresConsecutivos}/${MAX_ERRORES_CONSECUTIVOS}):`, error.message);

        // Si hay muchos errores consecutivos, aumentar el intervalo
        if (contadorErroresConsecutivos >= MAX_ERRORES_CONSECUTIVOS) {
            console.warn("Muchos errores consecutivos. Considera revisar la conexión o la API de FotMob.");
        }

    }
    finally {
        syncEnProgreso = false;
    }

}


//
// EJECUTAR UNA VEZ AL INICIAR (con delay para que el servidor termine de inicializar)
//
setTimeout(() => {
    ejecutarAutoSync();
}, 10000); // 10 segundos después del inicio


//
// EJECUTAR PERIÓDICAMENTE
//
setInterval(
    ejecutarAutoSync,
    INTERVALO_SYNC
);


//
// EXPORT
//
export default app;
