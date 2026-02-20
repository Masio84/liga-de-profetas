const API = "/api";
const COSTO_BASE = 10;

let usuarioId = null;
let celularGuardado = null; // Removed localStorage persistence

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

        // ACTUALIZAR HEADER UI
        const titulo = document.getElementById("jornadaTitulo");
        const fechas = document.getElementById("jornadaFechas");

        if (titulo) titulo.innerText = `JORNADA ${disponible.numero}`;
        if (fechas && disponible.fechaInicio && disponible.fechaFin) {
            fechas.innerText = `${formatearFecha(disponible.fechaInicio)} - ${formatearFecha(disponible.fechaFin)}`;
        }

        await cargarMatches(disponible.numero);
        await cargarPozoActual(); // También cargar el pozo

    } catch (error) {
        console.error("Error cargando jornada disponible:", error);
        const titulo = document.getElementById("jornadaTitulo");
        if (titulo) titulo.innerText = "Error de Conexión";
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
                grid-template-columns: 1fr 1fr 1fr;
                align-items:center;
                gap:8px;
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
                    <div style="font-weight:bold; font-size: 14px; line-height: 1.2;">${match.homeTeam}</div>
                </div>

                <!-- VS -->
                <div style="
                    font-weight:900;
                    font-size: 20px;
                    color: #94a3b8;
                    opacity:0.5;
                    text-align: center;
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
                    <div style="font-weight:bold; font-size: 14px; line-height: 1.2;">${match.awayTeam}</div>
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

        // Limpiar estilos inline previos para que mande el CSS
        btn.style = "";

        if (selecciones.includes(op)) {
            btn.classList.add("selected");
            // Agregar clase especifica para futuro styling si se desea
            if (op === "LOCAL") btn.classList.add("selected-local");
            else if (op === "EMPATE") btn.classList.add("selected-empate");
            else if (op === "VISITA") btn.classList.add("selected-visita");
        } else {
            btn.classList.remove("selected", "selected-local", "selected-empate", "selected-visita");
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
        btn.style = ""; // Remove inline
        btn.classList.remove("selected", "selected-local", "selected-empate", "selected-visita");
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
        container.style.display = "block"; // Siempre visible ahora
        list.innerHTML = '<div class="carrito-empty-message">Tu carrito está vacío.<br>Agrega quinielas para continuar.</div>';
        totalLabel.innerText = "$0";
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
                    <strong>Quiniela #${index + 1}</strong> <span style="font-size:0.8em; color:#94a3b8;">(Jornada ${q.jornada})</span>
                    <ul class="carrito-picks-list" style="margin:5px 0 0 10px; padding:0; font-size:0.85em; color:#cbd5e1; list-style:none;">
                        ${Object.entries(q.pronosticos).map(([mId, picks]) => {
            const m = matchesGlobal[mId];
            if (!m) return "";
            const picksText = picks.join("/"); // "LOCAL/EMPATE"
            // Formato corto: "America: L" ?? O "America vs Chivas: L"
            // User wants "resultados seleccionados visibles"
            // Let's try: "Local (vs Visita)" or just match label?
            // Let's go with: "Home vs Away: [SELECCION]"
            return `<li>${m.homeTeam} vs ${m.awayTeam}: <strong style="color:#00d4ff">${picksText}</strong></li>`;
        }).join("")}
                    </ul>
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

//
// MODAL PAGO LOGIC
//
function abrirModalPago() {
    const total = document.getElementById("carritoTotal").innerText;
    document.getElementById("modalTotalPagar").innerText = total;
    document.getElementById("modalPago").style.display = "block";
}

function cerrarModalPago() {
    document.getElementById("modalPago").style.display = "none";
}

function copiarCLABE() {
    const clabe = document.getElementById("clabeTexto").innerText;
    navigator.clipboard.writeText(clabe).then(() => {
        const feedback = document.getElementById("copiadoFeedback");
        feedback.style.opacity = "1";
        setTimeout(() => {
            feedback.style.opacity = "0";
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar: ', err);
    });
}

//
// CARGAR PARTICIPANTES (PUBLICO)
//
async function cargarParticipantes() {
    if (!jornadaSeleccionada) {
        // Fallback si se llama antes de cargar jornada
        const elTitulo = document.getElementById("jornadaTitulo");
        if (elTitulo && elTitulo.innerText.includes("Jornada")) {
            // Ya cargó visualmente, tal vez variable interna aun no? Raro.
            // Intentar obtener de window hack si es necesario
            if (window.jornadaActivaNumero) jornadaSeleccionada = window.jornadaActivaNumero;
        }
        if (!jornadaSeleccionada) return;
    }

    const tbody = document.getElementById("tablaParticipantesBody");
    if (!tbody) return;

    // Actualizar Subtitulo con Jornada
    const sub = document.getElementById("modalParticipantesSubtitle");
    if (sub) sub.innerText = `Participantes Jornada ${jornadaSeleccionada}`;

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Cargando...</td></tr>';

    try {
        const res = await fetch(`${API}/participaciones/jornada/${jornadaSeleccionada}/public`);
        const data = await res.json();

        tbody.innerHTML = "";

        if (!data.participantes || data.participantes.length === 0) {
            tbody.innerHTML = '<tr><td style="text-align:center; padding:20px; color:#94a3b8;">Aún no hay participantes confirmados.</td></tr>';
            return;
        }

        data.participantes.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <strong style="color: #4ade80; letter-spacing: 1px;">${p.folio || '---'}</strong>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #e2e8f0;">
                    ${p.nombre}
                </td>
             `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error cargando participantes:", error);
        tbody.innerHTML = '<tr><td style="text-align:center; color:#ef4444;">Error cargando lista.</td></tr>';
    }
}

async function enviarCarrito() {
    const nombre = document.getElementById("nombre").value.trim();
    const celular = document.getElementById("celular").value.trim();

    if (!nombre || !celular) {
        alert("Por favor ingresa tu Nombre y Celular para procesar las quinielas.");
        document.getElementById("nombre").focus();
        return;
    }

    if (carrito.length === 0) return;

    // VALIDACION MINIMA PARTICIPACION ($20)
    let totalCosto = 0;
    carrito.forEach(q => totalCosto += q.monto);

    if (totalCosto < 20) {
        // En lugar de alert, usamos un diseño bonito si es posible, o un alert claro
        // Usaremos el modal de "Reglamento Rápido" o un alert nativo bien redactado si no hay librería
        alert("⚠️ PARTICIPACIÓN MÍNIMA REQUERIDA: $20 MXN\n\nPara poder concursar, necesitas jugar al menos 2 quinielas sencillas o 1 quiniela doble.\n\n¡Agrega más pronósticos para continuar!");
        return;
    }

    // ABRIR MODAL EN LUGAR DE CONFIRM (User validation ok)
    abrirModalPago();
}

async function confirmarPagoYEnviar() {

    const btnConfirmar = document.querySelector("#modalPago .btn-action");
    const txtOriginal = btnConfirmar.innerText;
    btnConfirmar.innerText = "⏳ Enviando...";
    btnConfirmar.disabled = true;

    const nombre = document.getElementById("nombre").value.trim();
    const celular = document.getElementById("celular").value.trim();
    const referenciaPago = document.getElementById("referencia").value.trim();

    // VALIDACION CHECKBOX LEGAL
    const checkLegal = document.getElementById("checkLegal");
    if (!checkLegal || !checkLegal.checked) {
        alert("Debes aceptar los Términos y Condiciones y declarar ser mayor de edad para continuar.");
        btnConfirmar.innerText = txtOriginal;
        btnConfirmar.disabled = false;
        return;
    }

    // 1. Asegurar usuario
    let uId = usuarioId;
    if (!uId) {
        // Crear o buscar usuario
        try {
            console.log("DEBUG: Buscando usuario por celular:", celular);
            if (!celular || celular === "undefined") throw new Error("Celular inválido: " + celular);
            const buscar = await fetch(API + "/usuarios/celular/" + celular);

            console.log("DEBUG: GET Status:", buscar.status, "OK:", buscar.ok); // CHECKPOINT 1

            if (buscar.ok) {
                const u = await buscar.json();
                console.log("DEBUG: Usuario encontrado:", u); // CHECKPOINT 2
                uId = u.id;
            } else {
                console.log("DEBUG: Entrando a ELSE (Usuario no encontrado)"); // CHECKPOINT 3
                const crear = await fetch(API + "/usuarios", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre, celular })
                });

                console.log("DEBUG: Respuesta creación usuario:", crear.status, crear.statusText);

                if (!crear.ok) {
                    const errBody = await crear.text();
                    throw new Error(`Error creando usuario: ${crear.status} - ${errBody}`);
                }

                const nuevo = await crear.json();
                console.log("DEBUG: Usuario creado con ID:", nuevo.id);
                uId = nuevo.id;
            }
            usuarioId = uId;
            // localStorage.setItem("celular", celular); // Persistence removed
        } catch (e) {
            alert("Error conectando con el servidor (Usuario).");
            console.error(e);
            btnConfirmar.innerText = txtOriginal;
            btnConfirmar.disabled = false;
            return;
        }
    }

    // 2. REGISTRAR ACEPTACION LEGAL (Una vez por envío)
    try {
        await fetch(`${API}/legal/accept-terms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: uId,
                termsVersion: "1.0"
            })
        });
    } catch (errLegal) {
        console.error("Error registrando aceptación legal (no bloqueante):", errLegal);
    }

    // 3. ENVIAR LOTE (BATCH)
    try {
        // Preparar payload
        const batchBody = carrito.map(q => ({
            usuarioId: uId,
            jornada: q.jornada,
            monto: q.monto,
            pronosticos: q.pronosticosFormatoApi,
            referenciaPago
        }));

        const res = await fetch(`${API}/participaciones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(batchBody)
        });

        if (!res.ok) {
            const contentType = res.headers.get("content-type");
            let errorMessage = "Error al procesar el lote de quinielas";

            if (contentType && contentType.includes("application/json")) {
                const errData = await res.json();
                errorMessage = errData.error || errorMessage;
            } else {
                const textBody = await res.text();
                console.error("DEBUG: Error no-JSON recibido:", textBody);
                errorMessage = `Error del servidor (${res.status}): Posible timeout o falla de conexión.`;
            }
            throw new Error(errorMessage);
        }

        const data = await res.json();
        const resultados = data.participaciones || []; // Array de {id, folio}

        // Asignar folios a los items del carrito para el PDF
        // Asumimos orden preservado (Postgres RETURNING preserva orden de inserts, node pg tmb)
        // Pero para estar 100% seguros podriamos mapear, pero en batch insert simple suele ser lineal.
        // Si no, usamos el resultado.

        resultados.forEach((r, i) => {
            if (carrito[i]) {
                carrito[i].folio = r.folio;
            }
        });

        btnConfirmar.innerText = txtOriginal;
        btnConfirmar.disabled = false;
        cerrarModalPago();

        alert(`¡Éxito! Se enviaron ${resultados.length} quinielas.\n\nSe descargará tu TICKET DE PARTICIPACIÓN.\nÚsalo para realizar tu pago.`);

        // Generar PDF
        try {
            // Recolectar folios principal
            const mainFolio = resultados[0].folio || `F-${Date.now()}`;

            const datosPDF = {
                folio: mainFolio, // Usamos el primer folio como referencia del ticket
                nombre: nombre,
                celular: celular,
                quinielas: [...carrito],
                total: document.getElementById("carritoTotal").innerText,
                clabe: "728969000159916895", // CLABE actualizada (Spin by Oxxo)
                referencia: referenciaPago || "Tu Nombre/Celular"
            };
            generarTicketPDF(datosPDF);
        } catch (errPDF) {
            console.error("Error generando PDF", errPDF);
            alert("No se pudo generar el PDF automáticamente. Por favor toma captura de pantalla.");
        }

        carrito = [];
        renderizarCarrito();

    } catch (e) {
        console.error(e);
        alert(e.message);
        btnConfirmar.innerText = txtOriginal;
        btnConfirmar.disabled = false;
    }
}

//
// CARGAR HISTORIAL USUARIO
//
async function cargarParticipacionesUsuario() {
    if (!usuarioId) return;

    // Aquí iría lógica para obtener historial si existiera el endpoint filtrado
    // Por ahora, para evitar el crash, definimos la función vacía o con log
    // Si queremos implementarla bien:
    /*
    try {
        const res = await fetch(`${API}/participaciones/usuario/${usuarioId}`);
        // ... render
    } catch (e) { console.error(e); }
    */
    console.log("Cargando historial (Placeholder)...");
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
