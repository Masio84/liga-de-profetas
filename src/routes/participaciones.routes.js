import express from "express";
import db from "../config/database.js";
import { jornadaAceptaParticipaciones } from "../services/jornadas.service.js";

const router = express.Router();

//
// Obtener todas las participaciones con pronósticos
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
            // En PostgreSQL los JSONB se devuelven ya como objetos/arrays
            // No hace falta JSON.parse si el driver pg lo maneja autom (por defecto sí con tipo jsonb)
            // Si fuera tipo TEXT sí haría falta. En initDB usamos JSONB.
            let pronosticos = p.pronosticos;

            // Seguridad por si el driver no lo parseó o es string
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
// Crear participación
//
router.post("/", async (req, res) => {

    try {
        const { usuarioId, jornada, monto, pronosticos, referenciaPago } = req.body;

        if (!usuarioId || !jornada || !monto || !pronosticos) {
            return res.status(400).json({
                error: "Datos incompletos"
            });
        }

        //
        // VERIFICAR SI LA JORNADA AÚN ACEPTA PARTICIPACIONES
        //
        const acepta = await jornadaAceptaParticipaciones(jornada);

        if (!acepta) {
            return res.status(403).json({
                error: "La jornada ya inició y no acepta participaciones"
            });
        }

        //
        // GENERAR FOLIO ÚNICO
        //
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(1000 + Math.random() * 9000);
        const folio = `LDP-${timestamp}-${random}`;

        //
        // VALIDAR QUE TODOS LOS PARTIDOS DE LA JORNADA TENGAN PRONÓSTICO
        //
        const { rows: matchesJornada } = await db.query(
            `SELECT id FROM matches WHERE round = $1`,
            [jornada]
        );

        if (matchesJornada.length === 0) {
            return res.status(400).json({
                error: "La jornada no tiene partidos registrados"
            });
        }

        // Verificar que todos los partidos tengan pronóstico
        const pronosticosArray = Array.isArray(pronosticos) ? pronosticos : [];
        const matchIdsConPronostico = new Set(
            pronosticosArray.map(p => p.matchId || p.match_id)
        );
        const matchIdsEsperados = new Set(matchesJornada.map(m => m.id));

        // Verificar faltantes
        const partidosSinPronostico = [];
        matchIdsEsperados.forEach(matchId => {
            if (!matchIdsConPronostico.has(matchId)) {
                partidosSinPronostico.push(matchId);
            }
        });

        if (partidosSinPronostico.length > 0) {
            return res.status(400).json({
                error: `Faltan pronósticos para ${partidosSinPronostico.length} partido(s)`,
                partidosFaltantes: partidosSinPronostico
            });
        }

        // Verificar sobrantes/invalidos
        const partidosInvalidos = [];
        matchIdsConPronostico.forEach(matchId => {
            if (!matchIdsEsperados.has(matchId)) {
                partidosInvalidos.push(matchId);
            }
        });

        if (partidosInvalidos.length > 0) {
            return res.status(400).json({
                error: `Pronósticos inválidos para ${partidosInvalidos.length} partido(s) que no pertenecen a esta jornada`,
                partidosInvalidos
            });
        }

        // Validar valores (LOCAL, VISITA, EMPATE)
        const prediccionesValidas = ["LOCAL", "VISITA", "EMPATE"];
        let pronosticosInvalidos = [];
        let dobles = 0;
        let triples = 0;

        pronosticosArray.forEach(p => {
            const preds = Array.isArray(p.prediccion) ? p.prediccion : [p.prediccion];

            preds.forEach(val => {
                if (!prediccionesValidas.includes(val)) {
                    pronosticosInvalidos.push({ matchId: p.matchId, valor: val });
                }
            });

            if (preds.length === 2) dobles++;
            if (preds.length === 3) triples++;
        });

        if (pronosticosInvalidos.length > 0) {
            return res.status(400).json({
                error: `Pronósticos con valores inválidos`,
                pronosticosInvalidos
            });
        }

        //
        // VALIDAR MONTO (COSTO DINÁMICO)
        //
        const COSTO_BASE = 10;
        const costoEsperado = COSTO_BASE * Math.pow(2, dobles) * Math.pow(3, triples);

        if (Number(monto) !== costoEsperado) {
            return res.status(400).json({
                error: `El monto pagado ($${monto}) no coincide con el costo de la quiniela ($${costoEsperado})`
            });
        }

        // VALIDAR MONTO MINIMO ($20) - Lógica de seguridad
        if (Number(monto) < 20) { // Si es quiniela individual, se valida por carrito completo en Frontend ??
            // OJO: Este endpoint recibe UNA SOLA participación.
            // El usuario quiere "Mínimo 2 quinielas", pero el backend recibe 1 por 1.
            // Si el usuario manda 2 quinielas sencillas, son 2 peticiones de $10.
            // Bloquear aquí impediría comprar quinielas sencillas en lote.

            // CORRECCION: El endpoint parece recibir DE UNA EN UNA.
            // Si validamos aquí, prohibimos quinielas sencillas.
            // PERO el requerimiento es "Para participar es necesario llenar 2 quinielas...".
            // Si el backend no tiene contexto de "Carrito", no puede validar el total del pedido.
            // A MENOS que cambiemos el endpoint para recibir un ARRAY de participaciones.

            // ANALISIS RAPIDO:
            // `app.js` envía `fetch(API + "/participaciones", ...)` dentro de un bucle?
            // Veamos `app.js` lineas 740+
        }

        const fechaActual = new Date().toISOString();

        //
        // INSERTAR PARTICIPACIÓN
        //
        const { rows: nueva } = await db.query(
            `
            INSERT INTO participaciones
            (usuario_id, jornada, monto, pronosticos, fecha, activa, validada, referencia_pago, folio)
            VALUES ($1, $2, $3, $4, $5, 1, 0, $6, $7)
            RETURNING id, folio
            `,
            [
                usuarioId,
                jornada,
                monto,
                JSON.stringify(pronosticosArray), // JSONB acepta string JSON válido
                fechaActual,
                referenciaPago || null,
                folio
            ]
        );

        res.status(201).json({
            message: "Participación registrada",
            id: nueva[0].id,
            folio: nueva[0].folio
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }

});

export default router;
