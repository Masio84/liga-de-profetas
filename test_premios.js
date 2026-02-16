
import db from './src/config/database.js';
import { calcularPremios } from './src/services/premios.service.js';

async function testPrizeLogic() {
    console.log("Iniciando prueba de lógica de premios...");

    // 1. Limpiar datos de prueba (opcional, o usar una jornada específica de prueba)
    const JORNADA_PRUEBA = 999;

    await new Promise(r => db.run("DELETE FROM participaciones WHERE jornada = ?", [JORNADA_PRUEBA], r));
    await new Promise(r => db.run("DELETE FROM matches WHERE round = ?", [JORNADA_PRUEBA], r));

    // 2. Insertar partidos de prueba con IDs explícitos
    await new Promise(r => db.run(`INSERT INTO matches (id, fotmobMatchId, homeTeam, awayTeam, homeTeamId, awayTeamId, startTime, round, resultado) VALUES 
        (9991, 1, 'Team A', 'Team B', 1, 2, '2023-01-01', ?, 'LOCAL'),
        (9992, 2, 'Team C', 'Team D', 3, 4, '2023-01-01', ?, 'EMPATE')
    `, [JORNADA_PRUEBA, JORNADA_PRUEBA], r));

    // 3. Insertar usuarios (asumimos existen ids 1 y 2, si no, fallará FK. Vamos a insertar dummy)
    await new Promise(r => db.run("INSERT OR IGNORE INTO usuarios (id, nombre, celular, fechaRegistro) VALUES (991, 'User 1', '111', '2023'), (992, 'User 2', '222', '2023')", [], r));

    // 4. Insertar participaciones
    // Usuario 1: Acierta todo (2 aciertos)
    // NOTA: Usamos IDs 9991 y 9992 que acabamos de insertar
    const pred1 = JSON.stringify([{ matchId: 9991, prediccion: "LOCAL" }, { matchId: 9992, prediccion: "EMPATE" }]);
    await new Promise(r => db.run("INSERT INTO participaciones (usuarioId, jornada, monto, pronosticos, fecha, activa, validada, referenciaPago) VALUES (991, ?, 10, ?, '2023', 1, 1, 'REF001')", [JORNADA_PRUEBA, pred1], r));

    // Usuario 2: Acierta 1 (1 acierto)
    const pred2 = JSON.stringify([{ matchId: 9991, prediccion: "VISITA" }, { matchId: 9992, prediccion: "EMPATE" }]);
    await new Promise(r => db.run("INSERT INTO participaciones (usuarioId, jornada, monto, pronosticos, fecha, activa, validada, referenciaPago) VALUES (992, ?, 10, ?, '2023', 1, 1, 'REF002')", [JORNADA_PRUEBA, pred2], r));

    // 5. Calcular premios
    const resultado = await calcularPremios(JORNADA_PRUEBA);

    console.log("Resultado del cálculo:", JSON.stringify(resultado, null, 2));

    // Validaciones
    // Total Bolsa = 20 (2 users * 10)
    // Admin 30% = 6
    // Premios 70% = 14
    // 1ro (80% de 14) = 11.2 -> User 1
    // 2do (20% de 14) = 2.8 -> User 2

    // Buscamos ganador 1
    const ganador1 = resultado.ganadores.find(g => g.usuario === "User 1");
    // Buscamos ganador 2
    const ganador2 = resultado.ganadores.find(g => g.usuario === "User 2");

    if (resultado.resumen.bolsaTotal === 20 && ganador1 && ganador1.aciertos === 2 && ganador2 && ganador2.aciertos === 1) {
        console.log("PRUEBA EXITOSA: Cálculos correctos.");
    } else {
        console.error("PRUEBA FALLIDA: Cálculos incorrectos.");
        console.log("Ganador1:", ganador1);
        console.log("Ganador2:", ganador2);
    }
}

testPrizeLogic();
