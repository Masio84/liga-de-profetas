//
// GENERAR TICKET PDF (Estilo Ticket/Recibo)
//
async function generarTicketPDF(datos) {
    const { jsPDF } = window.jspdf;

    // Dimensiones tipo Ticket (80mm ancho - largo dinámico o fijo 200mm)
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 290] // 80mm ancho (estándar impresora térmica), largo suficiente
    });

    const margenX = 5;
    let margenY = 10;
    const anchoUtil = 70; // 80 - 10 margen

    // Cargar Logo (Asíncrono)
    const imgLogo = new Image();
    imgLogo.src = "assets/logo-original.png";

    imgLogo.onload = () => {
        renderTicket(doc, imgLogo, datos, margenX, margenY, anchoUtil);
    };

    imgLogo.onerror = () => {
        // Si falla logo, renderizar sin él
        renderTicket(doc, null, datos, margenX, margenY, anchoUtil);
    };

    // Helper para renderizar tras carga
    function renderTicket(doc, logo, datos, x, y, ancho) {
        let cursorY = y;

        // 1. LOGO & HEADER
        if (logo) {
            // Ajustar logo centrado
            const logoW = 20;
            const logoH = 20; // Asumiendo cuadrado o ajustar aspect
            const logoX = (80 - logoW) / 2;
            doc.addImage(logo, "PNG", logoX, cursorY, logoW, logoH);
            cursorY += 22;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("LIGA DE PROFETAS", 40, cursorY, { align: "center" });
        cursorY += 5;

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Ticket de Participación", 40, cursorY, { align: "center" });
        cursorY += 8;

        // SEPARADOR
        doc.setLineWidth(0.2);
        doc.setLineDash([1, 1], 0);
        doc.line(x, cursorY, x + ancho, cursorY);
        cursorY += 5;

        // 2. INFO GENERAL
        doc.setFontSize(7);
        doc.text(`FOLIO: ${datos.folio}`, x, cursorY);
        cursorY += 4;
        doc.text(`FECHA: ${new Date().toLocaleString()}`, x, cursorY);
        cursorY += 6;

        doc.text(`PARTICIPANTE:`, x, cursorY);
        cursorY += 4;
        doc.setFont("helvetica", "bold");
        doc.text(datos.nombre.substring(0, 35), x, cursorY);
        cursorY += 4;
        doc.text(datos.celular, x, cursorY);
        cursorY += 6;

        // SEPARADOR
        doc.setLineDash([1, 1], 0);
        doc.line(x, cursorY, x + ancho, cursorY);
        cursorY += 5;

        // 3. DETALLES (Quinielas)
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("DETALLE DE APUESTAS", 40, cursorY, { align: "center" });
        cursorY += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);

        datos.quinielas.forEach((q, idx) => {
            doc.setFont("helvetica", "bold");
            doc.text(`Quiniela #${idx + 1} (Jor ${q.jornada}) - $${q.monto}`, x, cursorY);
            cursorY += 4;

            // Mostrar Folio Individual
            if (q.folio) {
                doc.setFontSize(7);
                doc.setTextColor(100);
                doc.text(`Ref: ${q.folio}`, x, cursorY);
                doc.setTextColor(0);
                cursorY += 4;
            }

            doc.setFont("helvetica", "normal");
            doc.setFontSize(6);

            // Picks
            const picks = Object.entries(q.pronosticos).map(([mId, p]) => {
                const m = window.matchesGlobal ? window.matchesGlobal[mId] : null;
                // Acceso a matchesGlobal global si existe, sino generic
                const label = m ? `${m.homeTeam.substring(0, 10)} vs ${m.awayTeam.substring(0, 10)}` : `Juego ${mId}`;
                return `${label}: ${p}`;
            });

            picks.forEach(p => {
                doc.text(`- ${p}`, x + 2, cursorY);
                cursorY += 3;
            });
            cursorY += 2;
        });

        // 4. TOTALES
        cursorY += 2;
        doc.setLineDash([1, 1], 0);
        doc.line(x, cursorY, x + ancho, cursorY);
        cursorY += 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`TOTAL A PAGAR: $${datos.total}`, 40, cursorY, { align: "center" });
        cursorY += 8;

        // 5. BANCO (BANORTE)
        doc.setFillColor(240, 240, 240);
        doc.rect(x, cursorY, ancho, 25, 'F');
        cursorY += 5;

        doc.setFontSize(8);
        doc.text("DATOS PARA TRANSFERENCIA", 40, cursorY, { align: "center" });
        cursorY += 5;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");

        // BANCO
        doc.text("Banco:", x + 2, cursorY);
        doc.setFont("helvetica", "bold");
        doc.text("BANORTE", x + 25, cursorY);
        cursorY += 4;

        // CLABE
        doc.setFont("helvetica", "normal");
        doc.text("Cuenta/CLABE:", x + 2, cursorY);
        doc.setFont("helvetica", "bold");
        doc.text(datos.clabe, x + 25, cursorY);
        cursorY += 6;

        // REFERENCIA (RESALTADA)
        doc.setFillColor(0, 0, 0);
        doc.rect(x, cursorY, ancho, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(`REF: ${datos.referencia}`, 40, cursorY + 5, { align: "center" });
        doc.setTextColor(0, 0, 0);

        cursorY += 12;

        // 6. PIE
        doc.setFontSize(6);
        doc.setFont("helvetica", "italic");
        doc.text("Conserva este comprobante para aclaraciones.", 40, cursorY, { align: "center" });
        cursorY += 3;
        doc.text("¡Buena suerte!", 40, cursorY, { align: "center" });

        // SAVE
        doc.save(`Ticket_LigaProfetas_${datos.folio}.pdf`);
    }
}
