import express from "express";
import { syncResultados } from "../services/sync.service.js";
import { requireAdminAuth } from "../middleware/auth.js";

const router = express.Router();

// Aplicar autenticación a todas las rutas de sync
router.use(requireAdminAuth);


//
// ENDPOINT DE SINCRONIZACIÓN (usa el servicio consolidado)
//
router.post("/resultados", async (req, res) => {

    try {

        console.log("Sincronizando desde FotMob (endpoint manual)...");

        const resultado = await syncResultados();

        res.json({

            ok: true,

            insertados: resultado.insertados,

            actualizados: resultado.actualizados,

            total: resultado.insertados + resultado.actualizados,

            ultimaSync: resultado.ultimaSync

        });

    }
    catch(err){

        console.error("Error en sync manual:", err);

        res.status(500).json({

            ok: false,

            error: err.message

        });

    }

});


//
// ENDPOINT ESTADO
//
router.get("/estado", (req, res) => {

    res.json(

        global.syncStatus ||

        {

            ultimaSync: null,

            actualizados: 0,

            insertados: 0

        }

    );

});


export default router;
