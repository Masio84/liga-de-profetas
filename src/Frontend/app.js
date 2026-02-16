const API = window.location.port === "3000" ? "/api" : "http://localhost:3000/api";

let usuarioId = null;
let celularGuardado = localStorage.getItem("celular");

let jornadaSeleccionada = null;
let pronosticosSeleccionados = {};

let matchesGlobal = {};


//
// INIT USUARIO
//
async function initUsuario() {

    if (!celularGuardado) return;

    try {

        const res =
            await fetch(
                API + "/usuarios/celular/" +
                celularGuardado
            );

        if (res.ok) {

            const usuario =
                await res.json();

            usuarioId =
                usuario.id;

            document.getElementById("nombre").value =
                usuario.nombre;

            document.getElementById("celular").value =
                usuario.celular;

        }

    }
    catch (error) {
        console.error("Error en initUsuario:", error);
    }

}


//
// GENERAR URL ESCUDO
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
// CARGAR TODOS LOS MATCHES
//
async function cargarTodosLosMatches() {

    try {
        const res =
            await fetch(
                `${API}/matches`
            );

        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data =
            await res.json();

        matchesGlobal = {};

        if (data.matches && Array.isArray(data.matches)) {
            data.matches.forEach(match => {
                matchesGlobal[match.id] = match;
            });
        }
    } catch (error) {
        console.error("Error cargando todos los matches:", error);
        matchesGlobal = {};
    }

}


//
// CARGAR POZO ACTUAL + PREMIOS
//
async function cargarPozoActual() {

    if (!jornadaSeleccionada)
        return;

    try {

        const res =
            await fetch(
                `${API}/jornadas/${jornadaSeleccionada}/pozo`
            );

        const data =
            await res.json();

        const pozo = data.pozo || 0;
        const premios = data.premios || {
            premioPrimero: 0,
            premioSegundo: 0
        };

        // El pozo ya no se muestra en index, solo en admin

    }
    catch (error) {

        console.error("Error cargando pozo actual:", error);

    }

}


//
// CARGAR JORNADA DISPONIBLE
//
async function cargarJornadaDisponible() {

    try {
        const res =
            await fetch(
                `${API}/jornadas`
            );

        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data =
            await res.json();

        const disponibles =
            data.jornadas.filter(
                j =>
                    j.estado === "DISPONIBLE"
            );

        // Ordenar por número ascendente para tomar la más próxima
        disponibles.sort((a, b) => a.numero - b.numero);

        const disponible = disponibles.length > 0 ? disponibles[0] : null;

        if (!disponible) {
            // Elemento removed from HTML, handle gracefully or log
            console.log("No hay jornada disponible");
            return;
        }

        jornadaSeleccionada = disponible.numero;

        // Se actualiza ahora desde index.html iniciarHeader()
        // document.getElementById("jornadaActual").innerHTML = `<h2>Jornada ${disponible.numero}</h2>`;

        await cargarMatches(
            disponible.numero
        );
    } catch (error) {
        console.error("Error cargando jornada disponible:", error);
        document.getElementById(
            "jornadaActual"
        ).innerHTML =
            "<h2>Error al cargar jornada</h2>";
    }

}


//
// CREAR BOTÓN PROFESIONAL
//
function crearBotonPronostico(match, tipo) {

    let nombreEquipo = "";
    let subtitulo = "";

    if (tipo === "LOCAL") {

        nombreEquipo = match.homeTeam;
        subtitulo = "Local";

    }

    else if (tipo === "VISITA") {

        nombreEquipo = match.awayTeam;
        subtitulo = "Visitante";

    }

    else {

        nombreEquipo = "Empate";
        subtitulo = "Empate";

    }

    return `
    <button
        id="btn-${match.id}-${tipo}"
        onclick="seleccionarPronostico(${match.id}, '${tipo}')"
        style="
            width: 100%;
            padding:12px 5px;
            border-radius:8px;
            border:1px solid #333;
            background:#111;
            color:white;
            cursor:pointer;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            transition: all 0.2s;
            font-weight: bold;
            font-size: 14px;
        "
    >
        <span>${subtitulo}</span> 
    </button>
    `;

}


//
// CARGAR MATCHES CON DISEÑO PROFESIONAL
//
async function cargarMatches(numero) {

    try {
        const res =
            await fetch(
                `${API}/jornadas/${numero}/matches`
            );

        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data =
            await res.json();

        let html = "";

        pronosticosSeleccionados = {};

        if (!data.matches || !Array.isArray(data.matches)) {
            document.getElementById("matches").innerHTML = "<p>No hay partidos disponibles</p>";
            return;
        }

        data.matches.forEach(match => {

            const escudoLocal =
                obtenerEscudo(match.homeTeamId);

            const escudoVisita =
                obtenerEscudo(match.awayTeamId);

            html += `
        <div class="match-card" style="
            background:#0f172a;
            border-radius:12px;
            padding:15px;
            margin-bottom:15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">

            <div style="
                text-align:center;
                background: rgba(0, 212, 255, 0.1);
                border-radius: 6px;
                padding: 5px;
                margin-bottom: 12px;
                border: 1px solid rgba(0, 212, 255, 0.2);
            ">
                <span style="
                    font-size: 14px;
                    font-weight: bold;
                    color: #00d4ff;
                    text-transform: uppercase;
                ">
                    ${formatearFecha(match.startTime)}
                </span>
            </div>

            <div style="
                display:grid;
                grid-template-columns: 1fr auto 1fr;
                align-items:center;
                gap:10px;
                margin-bottom: 15px;
            ">

                <!-- LOCAL -->
                <div style="
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    text-align:center;
                ">
                    <div style="
                        width: 60px;
                        height: 60px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(255,255,255,0.05);
                        border-radius: 50%;
                        margin-bottom: 8px;
                        padding: 5px;
                    ">
                        <img src="${escudoLocal}" style="max-width:100%; max-height:100%;">
                    </div>
                    <div style="font-weight:bold; font-size: 15px;">${match.homeTeam}</div>
                </div>

                <!-- VS -->
                <div style="
                    font-weight:900;
                    font-size: 20px;
                    color: #94a3b8;
                    opacity:0.5;
                ">
                    VS
                </div>

                <!-- VISITA -->
                <div style="
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    text-align:center;
                ">
                    <div style="
                        width: 60px;
                        height: 60px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(255,255,255,0.05);
                        border-radius: 50%;
                        margin-bottom: 8px;
                        padding: 5px;
                    ">
                        <img src="${escudoVisita}" style="max-width:100%; max-height:100%;">
                    </div>
                    <div style="font-weight:bold; font-size: 15px;">${match.awayTeam}</div>
                </div>

            </div>

            ${match.resultado
                    ?
                    `
                <div style="
                    text-align:center;
                    color:gold;
                    margin-top:10px;
                    font-weight:bold;
                    font-size: 16px;
                    padding: 8px;
                    background: rgba(255, 215, 0, 0.1);
                    border-radius: 8px;
                ">
                    Resultado: ${match.resultado}
                </div>
                `
                    :
                    `
                <div style="
                    display:grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap:8px;
                    margin-top:10px;
                ">
                    <!-- Boton Local alineado a la izquierda (bajo equipo local) -->
                    ${crearBotonPronostico(match, "LOCAL")}

                    <!-- Boton Empate al centro -->
                    ${crearBotonPronostico(match, "EMPATE")}

                    <!-- Boton Visita a la derecha (bajo equipo visita) -->
                    ${crearBotonPronostico(match, "VISITA")}
                </div>
                `
                }

        </div>
        `;

        });

        document.getElementById(
            "matches"
        ).innerHTML =
            html;
    } catch (error) {
        console.error("Error cargando matches:", error);
        document.getElementById("matches").innerHTML =
            "<p style='color: red;'>Error al cargar partidos. Por favor recarga la página.</p>";
    }

}


//
// SELECCIONAR PRONOSTICO
//
const COSTO_BASE = 10;

function seleccionarPronostico(matchId, valor) {

    // Inicializar si no existe
    if (!pronosticosSeleccionados[matchId]) {
        pronosticosSeleccionados[matchId] = [];
    }

    const selecciones = pronosticosSeleccionados[matchId];
    const index = selecciones.indexOf(valor);

    if (index === -1) {
        // Agregar selección
        selecciones.push(valor);
    } else {
        // Quitar selección (toggle)
        selecciones.splice(index, 1);
    }

    // Si el array queda vacío, eliminar la llave
    if (selecciones.length === 0) {
        delete pronosticosSeleccionados[matchId];
    }

    // Actualizar UI de botones
    ["LOCAL", "EMPATE", "VISITA"].forEach(op => {
        const btn = document.getElementById(`btn-${matchId}-${op}`);
        if (!btn) return;

        if (selecciones.includes(op)) {
            btn.style.backgroundColor = "#22c55e";
            btn.style.border = "2px solid #16a34a";
            // Efecto de brillo para indicar selección activa
            btn.style.boxShadow = "0 0 10px rgba(34, 197, 94, 0.4)";
        } else {
            btn.style.backgroundColor = "#111";
            btn.style.border = "1px solid #333";
            btn.style.boxShadow = "none";
        }
    });

    actualizarCostoEstimado();
}

function actualizarCostoEstimado() {
    let dobles = 0;
    let triples = 0;

    Object.values(pronosticosSeleccionados).forEach(sel => {
        if (sel.length === 2) dobles++;
        if (sel.length === 3) triples++;
    });

    const costo = COSTO_BASE * (Math.pow(2, dobles)) * (Math.pow(3, triples));

    const btnParticipar = document.querySelector("button[onclick='participar()']");
    if (btnParticipar) {
        btnParticipar.innerHTML = `Participar ($${costo})`;
        // Guardar costo en atributo para usarlo al enviar
        btnParticipar.dataset.costo = costo;
    }
}


//
// CARGAR PARTICIPACIONES USUARIO
//
async function cargarParticipacionesUsuario() {

    if (!usuarioId)
        return;

    try {
        const res =
            await fetch(
                `${API}/participaciones`
            );

        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data =
            await res.json();

        const propias =
            (data.participaciones || []).filter(
                p =>
                    p.usuarioId === usuarioId &&
                    p.activa === 1
            );

        let html = "";

        propias.forEach(p => {

            const pronosticos =
                typeof p.pronosticos === "string"
                    ?
                    JSON.parse(p.pronosticos)
                    :
                    p.pronosticos;

            let lista = "";

            pronosticos.forEach(pr => {

                const match =
                    matchesGlobal[
                    pr.matchId
                    ];

                if (match) {

                    lista += `
                <div>
                    ${match.homeTeam}
                    vs
                    ${match.awayTeam}
                    →
                    <strong>
                    ${Array.isArray(pr.prediccion) ? pr.prediccion.join(" / ") : pr.prediccion}
                    </strong>
                </div>
                `;

                }

            });

            html += `
        <div class="participacion-card">

            <strong>
            Participación #${p.id}
            </strong>

            <div style="
                margin-top:5px;
            ">
                ${lista}
            </div>

        </div>
        `;

        });

        document.getElementById(
            "participaciones"
        ).innerHTML =
            html || "<p>No tienes participaciones activas</p>";
    } catch (error) {
        console.error("Error cargando participaciones:", error);
        document.getElementById("participaciones").innerHTML =
            "<p style='color: red;'>Error al cargar participaciones</p>";
    }

}


//
// PARTICIPAR
//
async function participar() {

    const nombre =
        document.getElementById("nombre").value.trim();

    const celular =
        document.getElementById("celular").value.trim();

    const referenciaPago =
        document.getElementById("referencia").value.trim();

    if (!nombre || !celular) {

        alert("Ingresa nombre y celular");
        return;

    }

    const buscar =
        await fetch(
            API +
            "/usuarios/celular/" +
            celular
        );

    if (buscar.ok) {

        const usuario =
            await buscar.json();

        usuarioId =
            usuario.id;

    }
    else {

        const crear =
            await fetch(
                API +
                "/usuarios",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        nombre,
                        celular
                    })
                }
            );

        const nuevo =
            await crear.json();

        usuarioId =
            nuevo.id;

        localStorage.setItem(
            "celular",
            celular
        );

    }

    // Validar que se hayan seleccionado pronósticos para todos los partidos
    if (!jornadaSeleccionada) {
        alert("No hay jornada disponible para participar");
        return;
    }

    // Obtener todos los partidos de la jornada
    let matchesJornada = [];
    try {
        const resMatches = await fetch(`${API}/jornadas/${jornadaSeleccionada}/matches`);
        const dataMatches = await resMatches.json();
        matchesJornada = dataMatches.matches || [];
    } catch (error) {
        alert("Error al obtener partidos de la jornada");
        console.error(error);
        return;
    }

    if (matchesJornada.length === 0) {
        alert("La jornada no tiene partidos registrados");
        return;
    }

    // Verificar que todos los partidos tengan pronóstico
    const partidosSinPronostico = [];
    matchesJornada.forEach(match => {
        if (!pronosticosSeleccionados[match.id]) {
            partidosSinPronostico.push(`${match.homeTeam} vs ${match.awayTeam}`);
        }
    });

    if (partidosSinPronostico.length > 0) {
        alert(`Debes seleccionar un pronóstico para todos los partidos.\n\nFaltan:\n${partidosSinPronostico.join("\n")}`);
        return;
    }

    // Validar que los pronósticos sean válidos
    const prediccionesValidas = ["LOCAL", "VISITA", "EMPATE"];
    // Flatten arrays to check all values
    const todosLosPronosticos = Object.values(pronosticosSeleccionados).flat();

    const pronosticosInvalidos = todosLosPronosticos.filter(
        p => !prediccionesValidas.includes(p)
    );

    if (pronosticosInvalidos.length > 0) {
        alert("Hay pronósticos con valores inválidos");
        return;
    }

    const pronosticos =
        Object.entries(
            pronosticosSeleccionados
        )
            .map(
                ([matchId, prediccion]) => ({
                    matchId:
                        parseInt(matchId),
                    prediccion
                })
            );

    try {
        const response = await fetch(
            `${API}/participaciones`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    usuarioId,
                    jornada:
                        jornadaSeleccionada,
                    monto: parseInt(document.querySelector("button[onclick='participar()']").dataset.costo || 10),
                    pronosticos,
                    referenciaPago
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            alert(`Error: ${result.error || "No se pudo crear la participación"}`);
            return;
        }

        alert("¡Participación creada exitosamente! Recuerda transferir $10 a la CLABE: 072010001847418050 para validar tu participación.");

        // Limpiar selecciones
        pronosticosSeleccionados = {};
        await cargarMatches(jornadaSeleccionada);
        await cargarParticipacionesUsuario();

    } catch (error) {
        alert("Error al crear la participación. Por favor intenta de nuevo.");
        console.error(error);
    }

}


//
// INIT
//
async function init() {

    await initUsuario();

    await cargarTodosLosMatches();

    await cargarJornadaDisponible();

    await cargarParticipacionesUsuario();

}

init();
