```javascript
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Manejo de errores del pool
pool.on('error', (err) => {
    console.error('Error inesperado en cliente de base de datos', err);
});

// Wrapper para consultas compatible con async/await
export const query = (text, params) => pool.query(text, params);

// Función para inicializar tablas
const initDB = async () => {
    try {
        console.log("Verificando/Creando tablas en PostgreSQL...");

        // TABLA USUARIOS
        await query(`
      CREATE TABLE IF NOT EXISTS usuarios(
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  celular TEXT NOT NULL UNIQUE,
  fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
`);

        // TABLA JORNADAS
        await query(`
      CREATE TABLE IF NOT EXISTS jornadas(
  id SERIAL PRIMARY KEY,
  numero INTEGER UNIQUE,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  estado TEXT DEFAULT 'PENDIENTE'
);
`);

        // TABLA MATCHES
        await query(`
      CREATE TABLE IF NOT EXISTS matches(
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
      CREATE TABLE IF NOT EXISTS participaciones(
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  jornada INTEGER NOT NULL,
  monto INTEGER NOT NULL,
  pronosticos JSONB, --Usamos JSONB para guardar arrays / objetos complejos
        fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  activa INTEGER DEFAULT 1, --1: Activa, 0: Desactivada
        validada INTEGER DEFAULT 0, --0: Pendiente, 1: Validada
        referencia_pago TEXT
);
`);

        // TABLA EVALUACION (Para guardar resultados históricos de jornadas)
        await query(`
      CREATE TABLE IF NOT EXISTS evaluacion_jornadas(
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
    pool
};
