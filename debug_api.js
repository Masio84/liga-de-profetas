
async function checkJornadas() {
    try {
        const res = await fetch('http://localhost:3000/api/jornadas');
        const data = await res.json();
        console.log("Jornadas API Response:");

        const disponibles = data.jornadas.filter(j => j.estado === "DISPONIBLE");
        disponibles.sort((a, b) => a.numero - b.numero);

        console.log("Sorted Disponibles (Start & End):");
        disponibles.forEach(j => {
            console.log(`Jornada ${j.numero}: ${j.fechaInicio} - ${j.fechaFin}`);
        });

        if (disponibles.length > 0) {
            const nextRound = disponibles[0];
            console.log(`Next Round Selected: ${nextRound.numero}`);

            const resMatches = await fetch(`http://localhost:3000/api/jornadas/${nextRound.numero}/matches`);
            const dataMatches = await resMatches.json();
            console.log(`Matches for Round ${nextRound.numero}:`);
            dataMatches.matches.forEach(m => {
                console.log(`${m.homeTeam} vs ${m.awayTeam} (${m.startTime})`);
            });
        } else {
            console.log("No available rounds found.");
        }
    } catch (e) {
        console.error(e);
    }
}

checkJornadas();
