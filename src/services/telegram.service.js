import fetch from 'node-fetch';

//
// SERVICIO DE NOTIFICACIONES TELEGRAM
// 
// Para activar:
// 1. Crea un Bot en Telegram:
//    - Busca a @BotFather
//    - Envía /newbot
//    - Ponle nombre y usuario (ej. LigaProfetasBot)
//    - Te dará un TOKEN (API KEY). Pégalo abajo.
//
// 2. Obtén tu Chat ID:
//    - Busca a @userinfobot (o @myidbot)
//    - Dale Start. Te dará tu "Id" (número). Pégalo abajo.
//
// 3. ¡Importante!
//    - Envía un "Hola" a TU nuevo bot para iniciar la conversación, 
//      si no, el bot no podrá escribirte.
//

const BOT_TOKEN = "7987837298:AAER7ssmwlNDiAWZhXSbojCFlcRk7tqQSnU";
const CHAT_ID = "7936347187";

export async function notificarAdminTelegram(data) {
    try {
        if (BOT_TOKEN === "CHANGE_ME" || CHAT_ID === "CHANGE_ME") {
            console.log("⚠️ TELEGRAM: Falta configurar TOKEN o CHAT_ID.");
            return;
        }

        const { cantidad, montoTotal, folios } = data;
        const folioMuestra = folios[0] || "N/A";

        // Mensaje formateado (Markdown V2 o HTML)
        const message = `🔔 *Nueva Participación* 🔔%0A%0A` +
            `💰 Monto: *$${montoTotal}*%0A` +
            `🎟️ Quinielas: ${cantidad}%0A` +
            `📄 Folio: \`${folioMuestra}\` ${cantidad > 1 ? '...' : ''}%0A` +
            `🕒 Hora: ${new Date().toLocaleTimeString()}`;

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${message}&parse_mode=Markdown`;

        // Enviar petición
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.ok) console.log("✅ Notificación Telegram enviada.");
                else console.error("❌ Error Telegram API:", data.description);
            })
            .catch(err => console.error("❌ Error red Telegram:", err.message));

    } catch (error) {
        console.error("Error en servicio Telegram:", error);
    }
}
