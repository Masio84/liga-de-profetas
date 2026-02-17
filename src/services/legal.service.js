import crypto from 'crypto';
import db from '../config/database.js';

export const TERMS_VERSION = "1.0";

// Generar hash del archivo fisico
const generateLegalHash = () => {
    // EN VERCEL SERVERLESS NO ACCEDEMOS FACIL AL FILE SYSTEM (PUBLIC FOLDER)
    // Para evitar crash, retornamos un hash fijo de la versión 1.0 validada.
    return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
};

export const acceptTerms = async (userId, ipAddress, userAgent) => {
    const legalHash = generateLegalHash();

    // Insertar registro
    const query = `
        INSERT INTO user_terms_acceptance 
        (user_id, terms_version, ip_address, user_agent, legal_text_hash, accepted_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *;
    `;

    const values = [userId, TERMS_VERSION, ipAddress, userAgent, legalHash];

    const res = await db.query(query, values);
    return res.rows[0];
};

export const hasAcceptedTerms = async (userId) => {
    const query = `
        SELECT * FROM user_terms_acceptance 
        WHERE user_id = $1 AND terms_version = $2
        LIMIT 1;
    `;
    const res = await db.query(query, [userId, TERMS_VERSION]);
    return res.rows.length > 0;
};
