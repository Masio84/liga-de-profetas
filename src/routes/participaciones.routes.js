import express from "express";
import db from "../config/database.js";
import { jornadaAceptaParticipaciones } from "../services/jornadas.service.js";
import { notificarAdminTelegram } from "../services/telegram.service.js";

const router = express.Router();

//
// Obtener todas las participaciones
//
router.get("/", async (req, res) => {
    try {
        const sql = `
            SELECT 
                p.id,
                p.usuario_id as "usuarioId",
                u.nombre as usuario,
                p.jornada,
                p.monto,
                p.activa,
                p.validada,
                p.fecha,
                p.referencia_pago as "referenciaPago",
                p.pronosticos
            FROM participaciones p
            JOIN usuarios u ON u.id = p.usuario_id
            ORDER BY p.id DESC
        `;

        const { rows } = await db.query(sql);

        const participaciones = rows.map(p => {
            let pronosticos = p.pronosticos;
            if (typeof pronosticos === 'string') {
                try {
                    pronosticos = JSON.parse(pronosticos || "[]");
                } catch {
                    pronosticos = [];
                }
            }

            return {
                id: p.id,
                usuarioId: p.usuarioId,
                usuario: p.usuario,
                jornada: p.jornada,
                monto: p.monto,
                activa: p.activa,
                validada: p.validada,
                fecha: p.fecha,
                referenciaPago: p.referenciaPago,
                pronosticos: Array.isArray(pronosticos) ? pronosticos : []
            };
        });

        res.json({ participaciones });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//
// Crear participación (Batch or Single)
//
router.post("/", async (req, res) => {

    // 1. Preparar datos y validar payload básico (SIN CONEXIÓN)
    let items = Array.isArray(req.body) ? req.body : [req.body];

    if (items.length === 0) {
        return res.status(400).json({ error: "No se enviaron participaciones" });
    }

    // VALIDAR MONTO TOTAL DEL LOTE (Regla >= $20)
    const totalLote = items.reduce((sum, item) => sum + Number(item.monto || 0), 0);
    if (totalLote < 20) {
        return res.status(400).json({
            error: `El monto total de la participación debe ser mínimo $20 MXN. (Total recibido: $${totalLote})`
        });
    }

    // 2. Verificar Jornada (DB POOL - SIN TRANSACCIÓN)
    // Evita deadlock al no tener un cliente tomado mientras se pide otro
    const firstJornada = items[0].jornada;

    // Validar consistencia de jornada en el lote antes de nada
    const mixed = items.some(i => i.jornada !== firstJornada);
    if (mixed) {
        return res.status(400).json({ error: "No se pueden mezclar jornadas en un mismo envío" });
    }

    try {
        const acepta = await jornadaAceptaParticipaciones(firstJornada);
        if (!acepta) {
            return res.status(403).json({ error: "La jornada ya inició y no acepta participaciones" });
        }
    } catch (errJornada) {
        return res.status(500).json({ error: "Error validando jornada: " + errJornada.message });
    }

    // 3. INSERTAR PARTICIPACIONES (Usando Pool Directo - Más ligero que transacción)
    try {
        const resultados = [];

        // Query única o bucle secuencial. Para batches pequeños loop está bien.
        // Usamos db.query que maneja el pool automáticamente (conecta, ejecuta, libera).

        const fechaActual = new Date().toISOString();

        for (const item of items) {
            const { usuarioId, jornada, monto, pronosticos, referenciaPago } = item;

            if (!usuarioId || !jornada || !monto || !pronosticos) {
                // Si falta dato, fallamos esta petición
                return res.status(400).json({ error: "Datos incompletos en una de las participaciones" });
            }

            // GENERAR FOLIO ÚNICO
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(1000 + Math.random() * 9000);
            const folio = `LDP-${timestamp}-${random}`;

            const pronosticosArray = Array.isArray(pronosticos) ? pronosticos : [];

            // Insertar sin transacción explícita
            const { rows: nueva } = await db.query(
                `INSERT INTO participaciones
                (usuario_id, jornada, monto, pronosticos, fecha, activa, validada, referencia_pago, folio)
                VALUES ($1, $2, $3, $4, $5, 1, 0, $6, $7)
                RETURNING id, folio`,
                [
                    usuarioId,
                    jornada,
                    monto,
                    JSON.stringify(pronosticosArray),
                    fechaActual,
                    referenciaPago || null,
                    folio
                ]
            );

            resultados.push(nueva[0]);
        }

        // NOTIFICACION TELEGRAM (Con Timeout de seguridad)
        // Usamos await para asegurar que Vercel no mate el proceso,
        // pero el servicio tiene un timeout interno de 2s para no bloquear.
        await notificarAdminTelegram({
            cantidad: resultados.length,
            montoTotal: totalLote,
            folios: resultados.map(r => r.folio)
        });

        if (items.length === 1) {
            res.status(201).json({
                message: "Participación registrada",
                id: resultados[0].id,
                folio: resultados[0].folio,
                participaciones: resultados
            });
        } else {
            res.status(201).json({
                message: "Participaciones registradas",
                participaciones: resultados,
                count: resultados.length
            });
        }

    } catch (err) {
        console.error("Error insertando participaciones:", err);
        res.status(500).json({ error: "Error guardando en base de datos: " + err.message });
    }
});

export default router;
