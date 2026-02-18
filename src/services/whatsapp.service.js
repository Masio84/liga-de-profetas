import fetch from 'node-fetch'; // Asegúrate de tener node-fetch o usar fetch nativo si es Node 18+

//
// SERVICIO DE NOTIFICACIONES WHATSAPP (CallMeBot)
// 
// Para activar:
// 1. Añade el número de teléfono (ya configurado): 5214492347305
// 2. Obtén la API KEY enviando el mensaje "I allow callmebot to send me messages" 
//    al contacto de CallMeBot en WhatsApp: +34 644 10 55 84
// 3. Coloca la API KEY abajo en la constante API_KEY
//

const PHONE_NUMBER = "5214492347305";
const API_KEY = "CHANGE_ME"; // <--- AQUÍ VA TU API KEY

export async function notificarAdminNuevaParticipacion(data) {
    try {
        if (API_KEY === "CHANGE_ME") {
            console.log("⚠️ WHATSAPP: No se ha configurado la API KEY. Mensaje no enviado.");
            return;
        }

        const { cantidad, montoTotal, folios } = data;
        const folioMuestra = folios[0] || "N/A";

        // Mensaje formateado
        const message = `🔔 *Nueva Participación* 🔔%0A%0A` +
            `💰 Monto: $${montoTotal}%0A` +
            `🎟️ Quinielas: ${cantidad}%0A` +
            `📄 Folio(s): ${folioMuestra} ${cantidad > 1 ? '...' : ''}%0A` +
            `🕒 Hora: ${new Date().toLocaleTimeString()}`;

        const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE_NUMBER}&text=${message}&apikey=${API_KEY}`;

        // Enviar petición (sin await para no bloquear respuesta al cliente)
        fetch(url)
            .then(res => {
                if (res.ok) console.log("✅ Notificación WhatsApp enviada al admin.");
                else console.error("❌ Error enviando notificación WhatsApp:", res.status);
            })
            .catch(err => console.error("❌ Error red WhatsApp:", err.message));

    } catch (error) {
        console.error("Error en servicio WhatsApp:", error);
    }
}
