import { syncResultados } from '../src/services/sync.service.js';
import dotenv from 'dotenv';
dotenv.config();

console.log("🔄 Iniciando Sincronización Manual post-reset...");
syncResultados()
    .then(res => console.log("✅ Sincronización completada:", res))
    .catch(err => console.error("❌ Error en sincronización:", err));
