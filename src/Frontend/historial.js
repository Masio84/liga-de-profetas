const API = "/api";

let matchesGlobal = {};


//
// ESCUDO
//
function obtenerEscudo(teamId) {

    if (!teamId)
        return "";

    return `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png`;

}


//
// FORMATEAR FECHA
//
function formatearFecha(fechaISO) {

    const fecha =
        new Date(fechaISO);

    return fecha.toLocaleString(
        "es-MX",
        {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


//
// CARGAR MATCHES GLOBAL
//
async function cargarMatchesGlobal() {

    const res =
        await fetch(`${API}/matches`);

    const data =
        await res.json();

    data.matches.forEach(m => {

        matchesGlobal[m.id] = m;

    });

}


//
// CARGAR JORNADAS FINALIZADAS
//
async function cargarJornadas() {

    const res =
        await fetch(`${API}/jornadas`);

    const data =
        await res.json();

    const finalizadas =
        data.jornadas.filter(
            j => j.estado === "FINALIZADA"
        );

    let html = "";

    finalizadas.forEach(j => {

        html += `
        <div class="participacion-card">

            <strong>
                Jornada ${j.numero}
            </strong>

            <button
            onclick="verJornada(${j.numero})"
            style="margin-left:10px;">
                Ver detalles
            </button>

        </div>
        `;

    });

    document.getElementById("listaJornadas")
        .innerHTML = html;

}


//
// VER DETALLE JORNADA CON PREMIO
//
async function verJornada(numero) {

    const resMatches =
        await fetch(`${API}/jornadas/${numero}/matches`);

    const dataMatches =
        await resMatches.json();

    const resEval =
        await fetch(`${API}/evaluacion/${numero}`);

    const dataEval =
        await resEval.json();

    let ganadorHTML =
        `<div>No hubo participaciones válidas</div>`;

    if (
        dataEval.ganadores &&
        dataEval.ganadores.length > 0
    ) {

        ganadorHTML = `
        <div style="
            background:#111;
            padding:10px;
            border:1px solid gold;
            border-radius:6px;
            margin-bottom:15px;
        ">

            <div style="
                color:gold;
                font-size:18px;
                font-weight:bold;
            ">
                🏆 Resultado de la Jornada
            </div>

            <div>
                🎯 Mejor puntaje:
                <strong>
                ${dataEval.mejorPuntaje}
                </strong>
            </div>

            <div>
                💰 Pozo total:
                <strong>
                $${dataEval.pozoTotal}
                </strong>
            </div>

            <div>
                👥 Ganadores:
                <strong>
                ${dataEval.ganadores.length}
                </strong>
            </div>

            <div>
                🪙 Premio por ganador:
                <strong style="color:gold;">
                $${dataEval.premioPorGanador}
                </strong>
            </div>

        </div>
        `;

    }

    let html =
        `<h2>Jornada ${numero}</h2>
         ${ganadorHTML}`;

    dataMatches.matches.forEach(match => {

        html += `
        <div class="match-card">

            <div>
                ${formatearFecha(match.startTime)}
            </div>

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-top:5px;
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                ">

                    <img src="${
                        obtenerEscudo(match.homeTeamId)
                    }"
                    width="24">

                    ${match.homeTeam}

                </div>

                vs

                <div style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                ">

                    ${match.awayTeam}

                    <img src="${
                        obtenerEscudo(match.awayTeamId)
                    }"
                    width="24">

                </div>

            </div>

            <div style="
                color:gold;
                margin-top:5px;
            ">
                Resultado:
                ${match.resultado}
            </div>

        </div>
        `;

    });

    document.getElementById("detalleJornada")
        .innerHTML = html;

}


//
// INIT
//
async function init() {

    await cargarMatchesGlobal();

    await cargarJornadas();

}

init();
