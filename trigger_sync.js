import { syncResultados } from './src/services/sync.service.js';

console.log("Forzando sincronización manual...");
syncResultados()
    .then(res => {
        console.log("Sincronización exitosa:", res);
    })
    .catch(err => {
        console.error("Error en sincronización:", err);
    });
