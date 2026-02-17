const API = "/api";

// Token de administrador
let adminToken = localStorage.getItem("adminToken");

// Función para mostrar modal de autenticación
function mostrarModalAuth() {
    return new Promise((resolve) => {
        // Crear modal si no existe
        let modal = document.getElementById("authModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "authModal";
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            modal.innerHTML = `
                <div style="
                    background: #1e293b;
                    padding: 30px;
                    border-radius: 12px;
                    border: 2px solid #00d4ff;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
                ">
                    <h2 style="color: #00d4ff; margin-top: 0;">Autenticación Requerida</h2>
                    <p style="color: #94a3b8; margin-bottom: 20px;">
                        Ingresa el token de administrador para continuar
                    </p>
                    <input 
                        type="password" 
                        id="tokenInput" 
                        placeholder="Token de administrador"
                        style="
                            width: 100%;
                            padding: 12px;
                            margin-bottom: 15px;
                            border-radius: 8px;
                            border: 2px solid #334155;
                            background: #0f172a;
                            color: white;
                            font-size: 16px;
                            box-sizing: border-box;
                        "
                        autofocus
                    >
                    <div style="display: flex; gap: 10px;">
                        <button 
                            id="btnAuthOk"
                            style="
                                flex: 1;
                                padding: 12px;
                                background: linear-gradient(135deg, #00d4ff, #0096ff);
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-weight: bold;
                                cursor: pointer;
                            "
                        >Ingresar</button>
                        <button 
                            id="btnAuthCancel"
                            style="
                                flex: 1;
                                padding: 12px;
                                background: #334155;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-weight: bold;
                                cursor: pointer;
                            "
                        >Cancelar</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const tokenInput = document.getElementById("tokenInput");
            const btnOk = document.getElementById("btnAuthOk");
            const btnCancel = document.getElementById("btnAuthCancel");

            // Enter para confirmar
            tokenInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    btnOk.click();
                }
            });

            btnOk.addEventListener("click", () => {
                const token = tokenInput.value.trim();
                if (token) {
                    adminToken = token;
                    localStorage.setItem("adminToken", token);
                    document.body.removeChild(modal);
                    resolve(token);
                } else {
                    alert("Por favor ingresa un token válido");
                }
            });

            btnCancel.addEventListener("click", () => {
                // Usar token por defecto si cancela
                adminToken = "Daniel1325";
                localStorage.setItem("adminToken", adminToken);
                console.warn("Usando token por defecto. Configura ADMIN_TOKEN en .env");
                document.body.removeChild(modal);
                resolve(adminToken);
            });
        } else {
            // Si el modal ya existe, solo mostrarlo
            modal.style.display = "flex";
            document.getElementById("tokenInput").focus();
        }
    });
}

// Función para resetear el token
function resetearToken() {
    if (confirm("¿Estás seguro de que quieres cambiar el token de administrador?")) {
        localStorage.removeItem("adminToken");
        adminToken = null;
        mostrarModalAuth().then(() => {
            location.reload();
        });
    }
}

// Hacer la función global para que pueda ser llamada desde el HTML
window.resetearToken = resetearToken;

// Si no hay token, mostrar modal (solo cuando el DOM esté listo)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!adminToken) {
            mostrarModalAuth().then(() => {
                // Recargar la página después de autenticar
                location.reload();
            });
        }
    });
} else {
    // DOM ya está listo
    if (!adminToken) {
        mostrarModalAuth().then(() => {
            // Recargar la página después de autenticar
            location.reload();
        });
    }
}

// Función helper para hacer peticiones autenticadas
async function fetchAuth(url, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    if (adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`;
    }

    const res = await fetch(url, {
        ...options,
        headers
    });

    if (!res.ok) {
        const text = await res.text();
        console.error(`Fetch Error (${res.status}):`, text);
        try {
            const json = JSON.parse(text);
            throw new Error(json.error || `Error ${res.status}: ${res.statusText}`);
        } catch (e) {
            throw new Error(`Error ${res.status}: ${text || res.statusText}`);
        }
    }

    return res;
}


//
// FORMATEAR FECHA
//
function formatearFecha(fechaISO) {

    if (!fechaISO)
        return "Nunca";

    const fecha =
        new Date(fechaISO);

    return fecha.toLocaleString(
        "es-MX",
        {
            dateStyle: "medium",
            timeStyle: "medium"
        }
    );

}


//
// CARGAR ESTADO DE SYNC
//
async function cargarEstadoSync() {

    try {

        const res =
            await fetchAuth(
                API +
                "/admin/sync/estado"
            );

        if (!res.ok) {
            throw new Error("Error obteniendo estado de sync");
        }

        const data =
            await res.json();

        document.getElementById(
            "syncEstado"
        ).innerHTML = `

            Última sincronización:<br>

            <strong>
            ${formatearFecha(data.ultimaSync)}
            </strong><br><br>

            Partidos actualizados:
            ${data.actualizados}<br>

            Partidos insertados:
            ${data.insertados}

        `;

    }
    catch (error) {

        document.getElementById(
            "syncEstado"
        ).innerHTML =
            "Error obteniendo estado";

    }

}


//
// CARGAR POZO ACTUAL
//
async function cargarPozoActual() {

    try {

        const res = await fetch("/api/jornadas");
        const data = await res.json();

        const disponibles = data.jornadas.filter(j => j.estado === "DISPONIBLE");

        // Sort ascending to get the upcoming one
        disponibles.sort((a, b) => a.numero - b.numero);

        const disponible = disponibles.length > 0 ? disponibles[0] : null;

        if (!disponible) {
            document.getElementById("pozoActual").innerHTML =
                "No hay jornada disponible";
            return;
        }

        const resPozo = await fetch(`/api/jornadas/${disponible.numero}/pozo`);
        const pozo = await resPozo.json();

        const premios = pozo.premios || {
            premioPrimero: 0,
            premioSegundo: 0
        };

        document.getElementById("pozoActual").innerHTML = `
            <strong>$${pozo.pozo ? parseFloat(pozo.pozo).toFixed(2) : "0.00"}</strong><br><br>
            🥇 1° Lugar: $${premios.premioPrimero ? parseFloat(premios.premioPrimero).toFixed(2) : "0.00"}<br>
            🥈 2° Lugar: $${premios.premioSegundo ? parseFloat(premios.premioSegundo).toFixed(2) : "0.00"}<br><br>
            <small>Jornada ${disponible.numero}</small>
        `;

    }
    catch (error) {

        console.error("Error cargando pozo actual:", error);
        document.getElementById("pozoActual").innerHTML =
            "Error cargando bolsa";

    }

}


//
// CARGAR PARTICIPACIONES ADMIN
//
async function cargarParticipacionesAdmin() {
    try {
        const res = await fetch(API + "/participaciones");

        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (!data.participaciones || data.participaciones.length === 0) {
            document.getElementById("adminParticipaciones").innerHTML =
                "<div class='participacion-card'>No hay participaciones registradas</div>";
            return;
        }

        let html = "";

        data.participaciones.forEach(p => {

            let estadoTexto = "";
            let color = "";
            let botones = "";

            if (p.activa === 0) {

                estadoTexto = "DESACTIVADA";
                color = "#ef4444";

                botones += `
                <button onclick="reactivarParticipacion(${p.id})">
                Reactivar
                </button>
            `;

            }
            else if (p.validada === 0) {

                estadoTexto = "PENDIENTE";
                color = "#f59e0b";

                botones += `
                <button onclick="validarParticipacion(${p.id})">
                Validar
                </button>
            `;

                botones += `
                <button onclick="desactivarParticipacion(${p.id})">
                Desactivar
                </button>
            `;

            }
            else {

                estadoTexto = "VALIDADA";
                color = "#22c55e";

                botones += `
                <button onclick="invalidarParticipacion(${p.id})">
                Invalidar
                </button>
            `;

                botones += `
                <button onclick="desactivarParticipacion(${p.id})">
                Desactivar
                </button>
            `;

            }

            html += `
        <div class="participacion-card">

            Usuario: ${p.usuario}<br>
            Jornada: ${p.jornada}<br>
            Monto: $${p.monto}<br>
            Referencia: <strong>${p.referenciaPago || "N/A"}</strong><br>

            Estado:
            <span style="color:${color}">
                ${estadoTexto}
            </span>

            <div>
                ${botones}
            </div>

        </div>
        `;

        });

        document.getElementById("adminParticipaciones").innerHTML = html;
    } catch (error) {
        console.error("Error cargando participaciones:", error);
        document.getElementById("adminParticipaciones").innerHTML =
            `<div class='participacion-card' style='color: #ef4444;'>Error cargando participaciones: ${error.message}</div>`;
    }
}


//
// CARGAR RESULTADO DE JORNADAS
//
async function cargarResultadosAdmin() {
    try {
        const res = await fetch(API + "/jornadas");

        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (!data.jornadas) {
            document.getElementById("adminResultados").innerHTML =
                "<div class='participacion-card'>No hay jornadas disponibles</div>";
            return;
        }

        const finalizadas = data.jornadas.filter(j => j.estado === "FINALIZADA");

        if (finalizadas.length === 0) {
            document.getElementById("adminResultados").innerHTML =
                "<div class='participacion-card'>No hay jornadas finalizadas</div>";
            return;
        }

        let html = "";

        for (const jornada of finalizadas) {
            try {
                const resEval = await fetch(API + "/evaluacion/" + jornada.numero);

                if (!resEval.ok) {
                    console.error(`Error evaluando jornada ${jornada.numero}:`, resEval.status);
                    continue;
                }

                const evalData = await resEval.json();

                html += `
                <div class="participacion-card">
                    <strong>Jornada ${jornada.numero}</strong><br>
                    Ganadores: ${evalData.ganadores.length}<br>
                    Pozo total: $${evalData.pozoTotal || 0}<br>
                    Mejor puntaje: ${evalData.mejorPuntaje || 0}
                </div>
                `;
            } catch (error) {
                console.error(`Error procesando jornada ${jornada.numero}:`, error);
            }
        }

        document.getElementById("adminResultados").innerHTML = html ||
            "<div class='participacion-card'>No se pudieron cargar los resultados</div>";

        // Cargar ganadores de la última jornada finalizada
        if (finalizadas.length > 0) {
            // Ordenar por numero descendente (la más reciente primero)
            finalizadas.sort((a, b) => b.numero - a.numero);
            const ultimaJornada = finalizadas[0];
            await cargarGanadoresRecientes(ultimaJornada.numero);
        } else {
            document.getElementById("adminGanadores").innerHTML =
                "<div style='text-align:center; padding:10px; color:#64748b'>No hay jornadas finalizadas aún</div>";
        }

    } catch (error) {
        console.error("Error cargando resultados:", error);
        document.getElementById("adminResultados").innerHTML =
            `<div class='participacion-card' style='color: #ef4444;'>Error cargando resultados: ${error.message}</div>`;
    }
}


//
// CARGAR GANADORES RECIENTES (DETALLADO)
//
async function cargarGanadoresRecientes(jornada) {
    try {
        const res = await fetchAuth(`${API}/admin/premios/${jornada}`);
        if (!res.ok) throw new Error("Error al obtener premios");

        const data = await res.json();
        const ganadores = data.ganadores;
        const container = document.getElementById("adminGanadores");

        if (!ganadores || ganadores.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #94a3b8;">
                    <small>Jornada ${jornada}</small><br>
                    No hubo ganadores
                </div>
            `;
            return;
        }

        let html = `<div style="text-align:center; margin-bottom:10px; color:#facc15; font-weight:bold;">Jornada ${jornada}</div>`;

        ganadores.forEach(g => {
            const enlaceWhatsapp = `https://wa.me/521${g.celular}?text=${encodeURIComponent(`¡Hola ${g.usuario}! Felicidades, ganaste el ${g.lugar}° lugar en la Quiniela de la Jornada ${jornada}. Tu premio es de $${g.premio.toFixed(2)}. Por favor compárteme tu cuenta para depositarte.`)}`;

            html += `
            <div style="
                background: rgba(0,0,0,0.3);
                padding: 10px;
                border-radius: 6px;
                margin-bottom: 8px;
                border-left: 3px solid ${g.lugar === 1 ? 'gold' : 'silver'};
            ">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:white;">${g.usuario}</strong>
                    <span style="color:${g.lugar === 1 ? 'gold' : 'silver'}; font-weight:bold;">
                        $${g.premio.toFixed(2)}
                    </span>
                </div>
                
                <div style="font-size:12px; color:#94a3b8; margin: 4px 0;">
                    ✅ ${g.aciertos} Aciertos <span style="color:#ef4444; margin-left:8px;">❌ ${g.errores} Errores</span>
                </div>

                <a href="${enlaceWhatsapp}" target="_blank" style="
                    display: block;
                    background: #22c55e;
                    color: white;
                    text-align: center;
                    padding: 4px;
                    border-radius: 4px;
                    text-decoration: none;
                    font-size: 11px;
                    margin-top: 5px;
                ">
                    📲 Mandar WhatsApp
                </a>
            </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error(error);
        document.getElementById("adminGanadores").innerHTML =
            "<div style='color:#ef4444'>Error cargando ganadores</div>";
    }
}


// VALIDAR
let participacionesCache = []; // Cache local para filtrado

async function cargarParticipacionesAdmin() {
    try {
        const res = await fetchAuth(`${API}/admin/participaciones`);
        if (!res.ok) throw new Error("Error fetching participaciones");

        const data = await res.json();
        participacionesCache = data.participaciones; // Guardar en cache

        renderizarParticipacionesAdmin(participacionesCache); // Render inicial

    } catch (error) {
        console.error(error);
        const container = document.getElementById("participacionesAdmin");
        if (container) container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Error cargando datos: ${error.message}</div>`;
    }
}

function filtrarAdmin() {
    const texto = document.getElementById("adminSearchInput").value.toLowerCase().trim();
    const estado = document.getElementById("adminStatusFilter").value;

    const filtradas = participacionesCache.filter(p => {
        // Filtro Texto (Nombre, Celular, Folio)
        const matchTexto =
            (p.usuario && p.usuario.toLowerCase().includes(texto)) ||
            (p.celular && p.celular.includes(texto)) ||
            (p.folio && p.folio.toLowerCase().includes(texto));

        // Filtro Estado
        let matchEstado = true;
        if (estado === "VALIDADA") matchEstado = (p.validada === 1 && p.activa === 1);
        if (estado === "PENDIENTE") matchEstado = (p.validada === 0 && p.activa === 1);
        if (estado === "DESACTIVADA") matchEstado = (p.activa === 0);

        return matchTexto && matchEstado;
    });

    renderizarParticipacionesAdmin(filtradas);
}

// VALIDAR
async function validarParticipacion(id) {
    if (!confirm("¿Validar esta participación?")) return;
    try {
        const res = await fetchAuth(`${API}/admin/participaciones/${id}/validar`, { method: "POST" });
        if (!res.ok) throw new Error("Error validando");
        await cargarParticipacionesAdmin();
        await cargarPozoActual();
    } catch (e) {
        console.error(e);
        alert("Error al validar");
    }
}

// INVALIDAR
async function invalidarParticipacion(id) {
    if (!confirm("¿Invalidar esta participación?")) return;
    try {
        const res = await fetchAuth(`${API}/admin/participaciones/${id}/invalidar`, { method: "POST" });
        if (!res.ok) throw new Error("Error invalidando");
        await cargarParticipacionesAdmin();
        await cargarPozoActual();
    } catch (e) {
        console.error(e);
        alert("Error al invalidar");
    }
}

// DESACTIVAR
async function desactivarParticipacion(id) {
    if (!confirm("¿Desactivar esta participación?")) return;
    try {
        const res = await fetchAuth(`${API}/admin/participaciones/${id}/desactivar`, { method: "POST" });
        if (!res.ok) throw new Error("Error desactivando");
        await cargarParticipacionesAdmin();
        await cargarPozoActual();
    } catch (e) {
        console.error(e);
        alert("Error al desactivar");
    }
}

// REACTIVAR
async function reactivarParticipacion(id) {
    if (!confirm("¿Reactivar esta participación?")) return;
    try {
        const res = await fetchAuth(`${API}/admin/participaciones/${id}/reactivar`, { method: "POST" });
        if (!res.ok) throw new Error("Error reactivando");
        await cargarParticipacionesAdmin();
        await cargarPozoActual();
    } catch (e) {
        console.error(e);
        alert("Error al reactivar");
    }
}

// Convertir renderizado actual en funcion reutilizable

renderizarParticipacionesAdmin(filtradas);
}

// Convertir renderizado actual en funcion reutilizable
function renderizarParticipacionesAdmin(lista) {
    const container = document.getElementById("participacionesAdmin");

    if (!container) return; // Validación de seguridad

    if (lista.length === 0) {
        container.innerHTML = "<div style='padding:20px; text-align:center; color:#94a3b8;'>No se encontraron participaciones con los filtros actuales.</div>";
        return;
    }

    let html = "";
    lista.forEach(p => {
        // ... (Logic to build HTML items)
        const statusClass = p.activa === 0 ? 'status-desactivada' : (p.validada === 1 ? 'status-validada' : 'status-pendiente');
        const statusText = p.activa === 0 ? 'DESACTIVADA' : (p.validada === 1 ? 'VALIDADA' : 'PENDIENTE');

        // Format Timestamp
        const fecha = new Date(p.fecha).toLocaleString();

        html += `
        <div class="participacion-item">
            <div class="participacion-info">
                <div style="margin-bottom:5px;">
                    <strong style="color:white; font-size:1.1em;">${p.usuario}</strong>
                    <span style="color:#94a3b8; margin-left:10px;">${p.celular}</span>
                </div>
                
                <div style="font-size:0.9em; color:#cbd5e1; margin-bottom:5px;">
                    Jornada: <strong style="color:var(--gold-primary)">${p.jornada}</strong> | 
                    Monto: $${p.monto} | 
                    Ref: <em style="color:white">${p.referenciaPago || 'N/A'}</em>
                    ${p.folio ? `| Folio: <strong style="color:#00d4ff">${p.folio}</strong>` : ''}
                </div>

                <div class="participacion-meta">
                    <span>📅 ${fecha}</span>
                </div>
            </div>

            <div style="text-align:right;">
                <span class="status-badge ${statusClass}">${statusText}</span>
                <div style="margin-top:10px;">
                    ${p.validada === 0 && p.activa === 1 ?
                `<button class="btn-mini btn-success" onclick="validarParticipacion(${p.id})">VALIDAR</button>` : ''}
                    
                    ${p.validada === 1 && p.activa === 1 ?
                `<button class="btn-mini btn-danger" onclick="invalidarParticipacion(${p.id})">INVALIDAR</button>` : ''}

                    ${p.activa === 1 ?
                `<button class="btn-mini btn-warning" onclick="desactivarParticipacion(${p.id})">DESACTIVAR</button>` :
                `<button class="btn-mini btn-info" onclick="reactivarParticipacion(${p.id})">REACTIVAR</button>`}
                </div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}
// INVALIDAR
async function invalidarParticipacion(id) {
    try {
        const res = await fetchAuth(
            `${API}/admin/participaciones/${id}/invalidar`,
            { method: "POST" }
        );

        if (!res.ok) {
            const error = await res.json();
            alert(`Error: ${error.error || "No se pudo invalidar la participación"}`);
            return;
        }

        await cargarParticipacionesAdmin();
        await cargarPozoActual();
    } catch (error) {
        console.error("Error invalidando participación:", error);
        alert("Error al invalidar la participación");
    }
}


// DESACTIVAR
async function desactivarParticipacion(id) {
    try {
        const res = await fetchAuth(
            `${API}/admin/participaciones/${id}/desactivar`,
            { method: "POST" }
        );

        if (!res.ok) {
            const error = await res.json();
            alert(`Error: ${error.error || "No se pudo desactivar la participación"}`);
            return;
        }

        await cargarParticipacionesAdmin();
        await cargarPozoActual();
    } catch (error) {
        console.error("Error desactivando participación:", error);
        alert("Error al desactivar la participación");
    }
}


// REACTIVAR
async function reactivarParticipacion(id) {
    try {
        const res = await fetchAuth(
            `${API}/admin/participaciones/${id}/reactivar`,
            { method: "POST" }
        );

        if (!res.ok) {
            const error = await res.json();
            alert(`Error: ${error.error || "No se pudo reactivar la participación"}`);
            return;
        }

        await cargarParticipacionesAdmin();
        await cargarPozoActual();
    } catch (error) {
        console.error("Error reactivando participación:", error);
        alert("Error al reactivar la participación");
    }
}


// SYNC RESULTADOS
async function syncResultados() {
    try {
        const res = await fetchAuth(
            API + "/admin/sync/resultados",
            { method: "POST" }
        );

        if (!res.ok) {
            const error = await res.json();
            alert(`Error: ${error.error || "No se pudo sincronizar"}`);
            return;
        }

        await cargarEstadoSync();
        await cargarPozoActual();
        await cargarResultadosAdmin();

        alert("Sincronización completada exitosamente");
    } catch (error) {
        console.error("Error sincronizando:", error);
        alert("Error al sincronizar resultados");
    }
}


// INIT
async function initAdmin() {

    await cargarEstadoSync();

    await cargarPozoActual();

    await cargarParticipacionesAdmin();

    await cargarResultadosAdmin();

}

initAdmin();
