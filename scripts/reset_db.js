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

async function resetDb() {
    try {
        console.log("⚠️ INICIANDO RESET DE BASE DE DATOS...");

        // Usamos TRUNCATE con CASCADE para limpiar todo y reiniciar IDs
        // Orden no importa tanto con CASCADE, pero por claridad listamos.
        const query = `
      TRUNCATE TABLE 
        participaciones, 
        user_terms_acceptance, 
        evaluacion_jornadas, 
        matches, 
        jornadas, 
        usuarios 
      RESTART IDENTITY CASCADE;
    `;

        await pool.query(query);

        console.log("✅ BASE DE DATOS LIMPIA. Todos los datos han sido eliminados.");

    } catch (err) {
        console.error("❌ Error reseteando DB:", err);
    } finally {
        await pool.end();
    }
}

resetDb();
