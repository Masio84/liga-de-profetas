const API = "/api";

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
        subtitulo = "Visita";
    }
    else {
        nombreEquipo = "Empate";
        subtitulo = "-";
    }

    return `
    <button
        id="btn-${match.id}-${tipo}"
        onclick="seleccionarPronostico(${match.id}, '${tipo}')"
        class="btn-pronostico"
    >
        <span class="team-name">${nombreEquipo}</span>
        ${tipo !== 'EMPATE' ? `<span class="role-label">${subtitulo}</span>` : ''} 
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

//
// CARRITO LOGIC
//
let carrito = [];

function actualizarCostoEstimado() {

    // Si no hay nada seleccionado, mostramos $0 visualmente
    if (Object.keys(pronosticosSeleccionados).length === 0) {
        const lblCosto = document.getElementById("costoActual");
        if (lblCosto) {
            lblCosto.innerText = "$0";
        }
        return 0;
    }

    let dobles = 0;
    let triples = 0;

    Object.values(pronosticosSeleccionados).forEach(sel => {
        if (sel.length === 2) dobles++;
        if (sel.length === 3) triples++;
    });

    const costo = COSTO_BASE * (Math.pow(2, dobles)) * (Math.pow(3, triples));

    const lblCosto = document.getElementById("costoActual");
    if (lblCosto) {
        lblCosto.innerText = "$" + costo;
    }

    return costo; // Return for usage
}

function limpiarSeleccion() {
    pronosticosSeleccionados = {};
    actualizarCostoEstimado();

    // Reset UI
    document.querySelectorAll(".match-card button").forEach(btn => {
        btn.style.backgroundColor = "#111";
        btn.style.border = "1px solid #333";
        btn.style.boxShadow = "none";
    });
}

async function agregarAlCarrito() {
    // 1. Validaciones básicas
    if (!jornadaSeleccionada) {
        alert("No hay jornada disponible.");
        return;
    }

    // Obtener matches para validar completitud
    let matchesJornada = [];
    try {
        const resMatches = await fetch(`${API}/jornadas/${jornadaSeleccionada}/matches`);
        const dataMatches = await resMatches.json();
        matchesJornada = dataMatches.matches || [];
    } catch (error) {
        console.error(error);
        return;
    }

    // Verificar que todos los partidos tengan pronóstico
    const partidosSinPronostico = [];
    matchesJornada.forEach(match => {
        // match.id debe ser string en las keys del objeto? no, es int key, pero accessos... 
        // pronosticosSeleccionados tiene keys ints.
        if (!pronosticosSeleccionados[match.id] || pronosticosSeleccionados[match.id].length === 0) {
            partidosSinPronostico.push(`${match.homeTeam} vs ${match.awayTeam}`);
        }
    });

    if (partidosSinPronostico.length > 0) {
        alert(`Faltan pronósticos en:\n${partidosSinPronostico.join("\n")}`);
        return;
    }

    // 2. Calcular costo
    const costo = actualizarCostoEstimado();

    // 3. Crear Objeto Quiniela
    const nuevaQuiniela = {
        idTemp: Date.now(), // ID temporal para el carrito
        jornada: jornadaSeleccionada,
        monto: costo,
        pronosticos: JSON.parse(JSON.stringify(pronosticosSeleccionados)), // Deep copy
        pronosticosFormatoApi: Object.entries(pronosticosSeleccionados).map(([mId, pred]) => ({
            matchId: parseInt(mId),
            prediccion: pred // Array o string
        }))
    };

    // 4. Agregar al array
    carrito.push(nuevaQuiniela);

    // 5. Actualizar UI
    renderizarCarrito();
    limpiarSeleccion();

    // Scroll al carrito en movil si es necesario, o feedback visual
    // alert("Quiniela agregada al carrito");
}

function eliminarDelCarrito(idTemp) {
    carrito = carrito.filter(q => q.idTemp !== idTemp);
    renderizarCarrito();
}

function renderizarCarrito() {
    const container = document.getElementById("carritoContainer");
    const list = document.getElementById("carritoItems");
    const totalLabel = document.getElementById("carritoTotal");

    if (carrito.length === 0) {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";

    let html = "";
    let total = 0;

    carrito.forEach((q, index) => {
        total += q.monto;
        html += `
            <div class="carrito-item">
                <div class="carrito-item-info">
                    <strong>Quiniela #${index + 1}</strong><br>
                    Jornada ${q.jornada}
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="carrito-item-cost">$${q.monto}</span>
                    <button class="btn-delete-item" onclick="eliminarDelCarrito(${q.idTemp})">×</button>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
    totalLabel.innerText = "$" + total;
}

async function enviarCarrito() {
    const nombre = document.getElementById("nombre").value.trim();
    const celular = document.getElementById("celular").value.trim();
    const referenciaPago = document.getElementById("referencia").value.trim();

    if (!nombre || !celular) {
        alert("Por favor ingresa tu Nombre y Celular para procesar las quinielas.");
        document.getElementById("nombre").focus();
        return;
    }

    if (carrito.length === 0) return;

    if (!confirm(`¿Confirmas enviar ${carrito.length} quinielas por un total de $${document.getElementById("carritoTotal").innerText}?`)) {
        return;
    }

    // 1. Asegurar usuario
    let uId = usuarioId;
    if (!uId) {
        // Crear o buscar usuario
        try {
            const buscar = await fetch(API + "/usuarios/celular/" + celular);
            if (buscar.ok) {
                const u = await buscar.json();
                uId = u.id;
            } else {
                const crear = await fetch(API + "/usuarios", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre, celular })
                });
                const nuevo = await crear.json();
                uId = nuevo.id;
            }
            usuarioId = uId;
            localStorage.setItem("celular", celular);
        } catch (e) {
            alert("Error conectando con el servidor (Usuario).");
            console.error(e);
            return;
        }
    }

    // 2. Enviar Sequencialmente (para no saturar o simplificar error handling)
    let enviadas = 0;
    let errores = 0;

    // Mostrar loading?
    const btnSubmit = document.querySelector(".btn-submit");
    const txtOriginal = btnSubmit.innerText;
    btnSubmit.innerText = "Enviando...";
    btnSubmit.disabled = true;

    for (const q of carrito) {
        try {
            const body = {
                usuarioId: uId,
                jornada: q.jornada,
                monto: q.monto,
                pronosticos: q.pronosticosFormatoApi,
                referenciaPago
            };

            const res = await fetch(`${API}/participaciones`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                enviadas++;
            } else {
                errores++;
            }

        } catch (e) {
            console.error(e);
            errores++;
        }
    }

    btnSubmit.innerText = txtOriginal;
    btnSubmit.disabled = false;

    if (errores === 0) {
        alert(`¡Éxito! Se enviaron ${enviadas} quinielas.\n\nRecuerda hacer tu pago total a la cuenta indicada.`);
        carrito = [];
        renderizarCarrito();
        cargarParticipacionesUsuario();
    } else {
        alert(`Se enviaron ${enviadas} quinielas, pero hubo ${errores} errores.\nRevisa tu historial y vuelve a intentar las que faltaron.`);
        // No limpiamos el carrito completo por si quiere reintentar? 
        // Simplificación: Limpiamos carrito visualmente para obligar a verificar historial
        carrito = [];
        renderizarCarrito();
        cargarParticipacionesUsuario();
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

    actualizarCostoEstimado();

}

init();
