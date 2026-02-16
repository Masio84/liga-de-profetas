import db from "../config/database.js";


//
// Evaluar jornada completa
//
export async function evaluarJornada(jornadaNumero) {

    try {
        //
        // 1. Obtener resultados reales
        //
        const { rows: matches } = await db.query(
            `SELECT id, resultado FROM matches WHERE round = $1`,
            [jornadaNumero]
        );

        const resultados = {};
        matches.forEach(m => {
            resultados[m.id] = m.resultado;
        });

        //
        // 2. Obtener participaciones válidas
        //
        const { rows: participaciones } = await db.query(
            `
            SELECT id, pronosticos, monto, activa, validada
            FROM participaciones
            WHERE jornada = $1 AND activa = 1 AND validada = 1
            `,
            [jornadaNumero]
        );

        if (participaciones.length === 0) {
            return {
                jornada: jornadaNumero,
                pozoTotal: 0,
                mejorPuntaje: 0,
                ganadores: [],
                premioPorGanador: 0
            };
        }

        let mejorPuntaje = -1;
        let ganadores = [];

        participaciones.forEach(p => {
            let pronosticos = p.pronosticos;
            // Manejo seguro de JSONB (pg devuelve objeto, SQLite string)
            if (typeof pronosticos === 'string') {
                try {
                    pronosticos = JSON.parse(pronosticos);
                } catch {
                    pronosticos = [];
                }
            }
            if (!Array.isArray(pronosticos)) pronosticos = [];

            let aciertos = 0;

            pronosticos.forEach(pr => {
                const resultadoReal = resultados[pr.matchId || pr.match_id];

                // Normalizar predicciones
                let preds = [];
                if (Array.isArray(pr.prediccion)) {
                    preds = pr.prediccion.map(v => v ? v.toUpperCase().trim() : null);
                } else {
                    preds = [pr.prediccion ? pr.prediccion.toUpperCase().trim() : null];
                }

                const resultadoNormalizado = resultadoReal
                    ? resultadoReal.toUpperCase().trim()
                    : null;

                // Si el resultado está en el array de predicciones, es un acierto
                if (resultadoNormalizado && preds.includes(resultadoNormalizado)) {
                    aciertos++;
                }
            });

            if (aciertos > mejorPuntaje) {
                mejorPuntaje = aciertos;
                ganadores = [p];
            } else if (aciertos === mejorPuntaje) {
                ganadores.push(p);
            }
        });

        //
        // 3. Calcular pozo total válido
        //
        const { rows: pozoRow } = await db.query(
            `
            SELECT SUM(monto) as "pozoTotal"
            FROM participaciones
            WHERE jornada = $1 AND activa = 1 AND validada = 1
            `,
            [jornadaNumero]
        );

        const pozoTotal = pozoRow[0].pozoTotal || 0;

        const premioPorGanador = ganadores.length > 0
            ? pozoTotal / ganadores.length
            : 0;

        return {
            jornada: jornadaNumero,
            pozoTotal,
            mejorPuntaje,
            ganadores,
            premioPorGanador
        };

    } catch (err) {
        throw err;
    }

}
