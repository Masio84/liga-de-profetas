import db from "../config/database.js";

//
// Calcular bolsa y distribución de premios por jornada
//
export async function calcularPremios(jornada) {
    try {
        // 1. Obtener todas las participaciones validadas y activas para la jornada
        const { rows: participaciones } = await db.query(`
            SELECT 
                p.id,
                p.usuario_id as "usuarioId",
                u.nombre as usuario,
                p.pronosticos,
                p.monto
            FROM participaciones p
            JOIN usuarios u ON u.id = p.usuario_id
            WHERE p.jornada = $1 AND p.validada = 1 AND p.activa = 1
        `, [jornada]);

        // 2. Obtener resultados reales de los partidos de esa jornada
        const { rows: matches } = await db.query(`
            SELECT id, resultado, fotmob_match_id
            FROM matches
            WHERE round = $1 AND resultado IS NOT NULL
        `, [jornada]);

        const resultadosMap = {};
        matches.forEach(m => {
            resultadosMap[m.id] = m.resultado; // "LOCAL", "VISITA", "EMPATE"
        });

        // 3. Calcular aciertos por participación
        const participantesPuntajes = participaciones.map(p => {
            let aciertos = 0;
            let pronosticos = p.pronosticos;

            if (typeof pronosticos === 'string') {
                try {
                    pronosticos = JSON.parse(pronosticos || "[]");
                } catch (e) {
                    pronosticos = [];
                }
            } else if (!Array.isArray(pronosticos)) {
                pronosticos = [];
            }

            pronosticos.forEach(pred => {
                const matchId = pred.matchId || pred.match_id;
                // Manejar predicciones simples y múltiples
                const preds = Array.isArray(pred.prediccion) ? pred.prediccion : [pred.prediccion];

                // Verificar si acertó
                const resultadoReal = resultadosMap[matchId];
                if (resultadoReal && preds.includes(resultadoReal)) {
                    aciertos++;
                }
            });

            return {
                ...p,
                aciertos
            };
        });

        // 4. Calcular bolsa
        const totalParticipantes = participaciones.length;
        const costoParticipacion = 10; // 10 pesos (podría venir de DB si es variable)
        // Ojo: Podríamos sumar p.monto real si queremos ser exactos a lo que pagaron
        const bolsaTotal = participantesPuntajes.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

        const comisionAdmin = bolsaTotal * 0.30;
        const bolsaPremios = bolsaTotal * 0.70;

        const premioPrimerLugar = bolsaPremios * 0.80;
        const premioSegundoLugar = bolsaPremios * 0.20;

        // 5. Determinar ganadores
        // Ordenar por aciertos descendente
        participantesPuntajes.sort((a, b) => b.aciertos - a.aciertos);

        if (participantesPuntajes.length === 0) {
            return {
                jornada,
                resumen: {
                    participantes: 0,
                    bolsaTotal: 0,
                    comisionAdmin: 0,
                    bolsaPremios: 0
                },
                ganadores: []
            };
        }

        // Encontrar puntaje máximo (1er lugar)
        const maxAciertos1 = participantesPuntajes[0].aciertos;

        // Filtrar quienes tienen ese puntaje
        const ganadores1 = participantesPuntajes.filter(p => p.aciertos === maxAciertos1);

        // Encontrar puntaje segundo lugar (excluyendo a los del primero)
        let ganadores2 = [];
        let maxAciertos2 = 0;

        const restantes = participantesPuntajes.filter(p => p.aciertos < maxAciertos1);
        if (restantes.length > 0) {
            maxAciertos2 = restantes[0].aciertos;
            ganadores2 = restantes.filter(p => p.aciertos === maxAciertos2);
        }

        // 6. Repartir dinero
        // Si hay N ganadores del primer lugar, se dividen el premio de 1er lugar
        const montoPorGanador1 = ganadores1.length > 0 ? (premioPrimerLugar / ganadores1.length) : 0;

        // Si hay M ganadores del segundo lugar, se dividen el premio de 2do lugar
        const montoPorGanador2 = ganadores2.length > 0 ? (premioSegundoLugar / ganadores2.length) : 0;

        // Formatear respuesta
        const listaGanadores = [
            ...ganadores1.map(g => ({
                usuario: g.usuario,
                aciertos: g.aciertos,
                lugar: 1,
                premio: montoPorGanador1,
                detalle: "Empate 1er lugar"
            })),
            ...ganadores2.map(g => ({
                usuario: g.usuario,
                aciertos: g.aciertos,
                lugar: 2,
                premio: montoPorGanador2,
                detalle: "Empate 2do lugar"
            }))
        ];

        return {
            jornada,
            resumen: {
                participantes: totalParticipantes,
                bolsaTotal,
                comisionAdmin,
                bolsaPremios,
                desglose: {
                    premio1erLugarTotal: premioPrimerLugar,
                    premio2doLugarTotal: premioSegundoLugar
                }
            },
            ganadores: listaGanadores
        };

    } catch (err) {
        throw err;
    }
}
