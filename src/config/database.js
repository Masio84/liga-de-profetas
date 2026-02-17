import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("⚠️ CRITICAL: DATABASE_URL no está definida en las variables de entorno.");
} else {
  // Ocultar contraseña para los logs
  const masked = connectionString.replace(/:([^:@]+)@/, ':****@');
  console.log("ℹ️ Intentando conectar a la DB con:", masked);
}

const pool = new Pool({
  connectionString: connectionString,
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
                referencia_pago TEXT,
                folio TEXT UNIQUE -- Folio único de participación
            );
        `);

    // MIGRATION: Ensure folio exists for existing tables
    await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participaciones' AND column_name='folio') THEN 
                    ALTER TABLE participaciones ADD COLUMN folio TEXT UNIQUE; 
                END IF; 
            END $$;
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

    // TABLA ACEPTACION TERMINOS (Legal Audit)
    await query(`
            CREATE TABLE IF NOT EXISTS user_terms_acceptance (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES usuarios(id),
                terms_version TEXT NOT NULL,
                accepted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT,
                legal_text_hash TEXT
            );
        `);

    // ÍNDICES PARA MEJORAR PERFORMANCE (SCALABILITY)
    console.log("Verificando índices...");
    await query(`CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_participaciones_usuario ON participaciones(usuario_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_participaciones_jornada ON participaciones(jornada);`);

    console.log("Tablas e índices inicializados correctamente.");
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
