import { Router } from "express";
import db from "../config/database.js";

const router = Router();

//
// Crear usuario
//
router.post("/", async (req, res) => {

    const { nombre, celular } = req.body;

    if (!nombre || !celular) {
        return res.status(400).json({
            error: "Nombre y celular son obligatorios"
        });
    }

    const fechaRegistro = new Date().toISOString();

    try {
        const sql = `
            INSERT INTO usuarios (nombre, celular, fecha_registro)
            VALUES ($1, $2, $3)
            RETURNING id, nombre, celular
        `;

        const { rows } = await db.query(sql, [nombre, celular, fechaRegistro]);

        res.json(rows[0]);

    } catch (err) {
        if (err.message.includes("unique constrain") || err.code === '23505') {
            return res.status(400).json({
                error: "Este celular ya está registrado"
            });
        }

        return res.status(500).json({
            error: err.message
        });
    }

});

//
// Obtener usuario por celular
//
router.get("/celular/:celular", async (req, res) => {

    const celular = req.params.celular;

    try {
        const { rows } = await db.query(
            "SELECT id, nombre, celular, fecha_registro FROM usuarios WHERE celular = $1",
            [celular]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Mapear camelCase
        const u = rows[0];
        res.json({
            id: u.id,
            nombre: u.nombre,
            celular: u.celular,
            fechaRegistro: u.fecha_registro
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

//
// Obtener todos
//
router.get("/", async (req, res) => {

    try {
        const { rows } = await db.query("SELECT id, nombre, celular FROM usuarios");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

export default router;
