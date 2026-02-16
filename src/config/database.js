import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

// Función para obtener configuración de DB resolviendo IPv4 explícitamente
// Esto evita errores ENETUNREACH en Render cuando intenta usar IPv6 con Supabase
const getDbConfig = async () => {

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL no está definida");
    }

    try {
        const url = new URL(connectionString);
        console.log(`Resolviendo IP (Lookup family: 4) para ${url.hostname}...`);

        // Usamos dns.lookup con family: 4 para obligar a obtener IPv4
        // Esto usa el resolver del sistema (getaddrinfo) que puede ser más permisivo que resolve4
        const { address } = await lookup(url.hostname, { family: 4 });

        if (address) {
            console.log(`DNS Resuelto: ${url.hostname} -> ${address}`);

            return {
                host: address, // Usamos la IP resuelta
                port: url.port || 5432,
                user: url.username,
                password: url.password,
                database: url.pathname.slice(1),
                ssl: {
                    rejectUnauthorized: false
                }
            };
        }
    } catch (e) {
        console.warn("Fallo resolución IPv4 (lookup):", e.message);
        // Si falla, probablemente fallará la conexión normal también si no hay IPv6 route
    }

    return {
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    };
};

let pool;

// Inicialización asíncrona del pool
const initPool = async () => {
    if (!pool) {
        const config = await getDbConfig();
        pool = new Pool(config);

        // Manejo de errores del pool
        pool.on('error', (err) => {
            console.error('Error inesperado en cliente de base de datos', err);
        });
    }
    return pool;
};

// Instancia inicial para querys rápidas (promesa pendiente)
// IMPORTANTE: query() ahora debe esperar a que el pool inicie.
let poolPromise = initPool();


// Wrapper para consultas compatible con async/await
export const query = async (text, params) => {
    const p = await poolPromise;
    return p.query(text, params);
};

// Función para inicializar tablas
const initDB = async () => {
    try {
        console.log("Verificando/Creando tablas en PostgreSQL...");

        // TABLA USUARIOS
        await query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        celular TEXT NOT NULL UNIQUE,
        fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // TABLA JORNADAS
        await query(`
      CREATE TABLE IF NOT EXISTS jornadas (
        id SERIAL PRIMARY KEY,
        numero INTEGER UNIQUE,
        fecha_inicio TIMESTAMPTZ,
        fecha_fin TIMESTAMPTZ,
        estado TEXT DEFAULT 'PENDIENTE'
      );
    `);

        // TABLA MATCHES
        await query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        round INTEGER NOT NULL,
        resultado TEXT,
        status TEXT,
        fotmob_match_id INTEGER UNIQUE,
        home_team_id INTEGER,
        away_team_id INTEGER
      );
    `);

        // TABLA PARTICIPACIONES (Con referencia a usuarios)
        await query(`
      CREATE TABLE IF NOT EXISTS participaciones (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        jornada INTEGER NOT NULL,
        monto INTEGER NOT NULL,
        pronosticos JSONB, -- Usamos JSONB para guardar arrays/objetos complejos
        fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        activa INTEGER DEFAULT 1, -- 1: Activa, 0: Desactivada
        validada INTEGER DEFAULT 0, -- 0: Pendiente, 1: Validada
        referencia_pago TEXT
      );
    `);

        // TABLA EVALUACION (Para guardar resultados históricos de jornadas)
        await query(`
      CREATE TABLE IF NOT EXISTS evaluacion_jornadas (
        id SERIAL PRIMARY KEY,
        jornada_numero INTEGER UNIQUE,
        pozo_total INTEGER,
        ganadores JSONB,
        mejor_puntaje INTEGER,
        fecha_evaluacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log("Tablas inicializadas correctamente en Supabase.");
    } catch (err) {
        console.error("Error inicializando base de datos:", err);
    }
};

// Ejecutar init al importar (o llamar manualmente en server.js)
initDB();

export default {
    query,
    getPool: async () => poolPromise // Getter asíncrono si se necesita el objeto raw
};
