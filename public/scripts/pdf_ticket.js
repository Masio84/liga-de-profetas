
//
// GENERAR TICKET PDF
//
async function generarTicketPDF(datos) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const margenX = 20;
    let margenY = 20;

    // 1. HEADER
    // Logo (Simulado con texto o imagen si es posible cargarla base64)
    doc.setFontSize(22);
    doc.setTextColor(197, 160, 89); // Gold
    doc.text("LIGA DE PROFETAS", margenX, margenY);

    margenY += 10;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("TICKET DE PARTICIPACIÓN", margenX, margenY);

    margenY += 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, margenX, margenY);

    margenY += 6;
    doc.text(`Folio: ${datos.folio}`, margenX, margenY);

    // 2. DATOS USUARIO
    margenY += 15;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("DATOS DEL PARTICIPANTE", margenX, margenY);
    doc.setLineWidth(0.5);
    doc.line(margenX, margenY + 2, 190, margenY + 2);

    margenY += 10;
    doc.setFontSize(10);
    doc.text(`Nombre: ${datos.nombre}`, margenX, margenY);
    doc.text(`Celular: ${datos.celular}`, margenX + 100, margenY);

    // 3. DETALLE QUINIELAS
    margenY += 15;
    doc.setFontSize(12);
    doc.text("DETALLE DE APUESTAS", margenX, margenY);
    doc.line(margenX, margenY + 2, 190, margenY + 2);

    margenY += 10;
    doc.setFontSize(9);

    datos.quinielas.forEach((q, index) => {
        // Verificar espacio en pagina
        if (margenY > 250) {
            doc.addPage();
            margenY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.text(`Quiniela #${index + 1} (Jornada ${q.jornada}) - Monto: $${q.monto}`, margenX, margenY);
        margenY += 5;
        doc.setFont("helvetica", "normal");

        // Listar Pronosticos con nombres de equipos
        const picks = Object.entries(q.pronosticos).map(([mId, p]) => {
            const m = matchesGlobal[mId];
            const equipos = m ? `${m.homeTeam} vs ${m.awayTeam}` : `Partido ${mId}`;
            return `${equipos}: ${p}`;
        });

        // Imprimir en columnas o lista
        picks.forEach(p => {
            if (margenY > 270) {
                doc.addPage();
                margenY = 20;
            }
            doc.text(`• ${p}`, margenX + 5, margenY);
            margenY += 4;
        });

        margenY += 5;
    });

    // 4. TOTAL Y PAGO
    if (margenY > 220) {
        doc.addPage();
        margenY = 20;
    } else {
        margenY += 10;
    }

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("INSTRUCCIONES DE PAGO", margenX, margenY);
    doc.line(margenX, margenY + 2, 190, margenY + 2);

    margenY += 10;
    doc.setFontSize(10);
    doc.text(`TOTAL A PAGAR: $${datos.total}`, margenX, margenY);

    margenY += 8;
    doc.setFont("helvetica", "bold");
    doc.text(`CLABE INTERBANCARIA: ${datos.clabe}`, margenX, margenY);

    margenY += 6;
    doc.setFont("helvetica", "normal");
    doc.text("Banco: STP", margenX, margenY);

    margenY += 6;
    doc.text(`Concepto/Referencia: ${datos.referencia}`, margenX, margenY);

    // 5. FOOTER
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Liga de Profetas - Plataforma de Concurso de Habilidad", 105, 285, { align: "center" });
        doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: "right" });
    }

    // DESCARGAR
    doc.save(`Ticket_LigaProfetas_${datos.folio}.pdf`);
}
