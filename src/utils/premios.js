//
// Utilidad centralizada para cálculo de premios
// Reglas:
// - 70% del pozo total va a premios
// - 30% va a gastos administrativos
// - Del 70%: 80% primer lugar, 20% segundo lugar
//

export function calcularPremios(pozoTotal) {
    
    const pozo = pozoTotal || 0;
    
    // 70% para premios
    const bolsaPremios = pozo * 0.70;
    
    // 30% para gastos administrativos
    const gastosAdministrativos = pozo * 0.30;
    
    // Del 70%: 80% primer lugar, 20% segundo lugar
    const premioPrimero = bolsaPremios * 0.80;
    const premioSegundo = bolsaPremios * 0.20;
    
    return {
        pozoTotal: pozo,
        bolsaPremios: Math.floor(bolsaPremios),
        gastosAdministrativos: Math.floor(gastosAdministrativos),
        premioPrimero: Math.floor(premioPrimero),
        premioSegundo: Math.floor(premioSegundo)
    };
}
