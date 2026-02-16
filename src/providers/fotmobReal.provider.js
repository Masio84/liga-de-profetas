const FOTMOB_URL =
"https://www.fotmob.com/api/leagues?id=230&ccode3=MEX";

export async function obtenerPartidosLigaMX() {

    console.log("Sincronizando desde FotMob...");

    const res = await fetch(FOTMOB_URL, {

        headers: {

            "User-Agent": "Mozilla/5.0",

            "Accept": "application/json"

        }

    });

    if (!res.ok)
        throw new Error(
            `FotMob respondió ${res.status}`
        );

    const data = await res.json();

    if (
        !data?.details ||
        data.details.name !== "Liga MX"
    ) {

        throw new Error(
            "Liga incorrecta recibida"
        );

    }

    const matches =
        data?.fixtures?.allMatches;

    if (!Array.isArray(matches))
        throw new Error(
            "fixtures.allMatches no encontrado"
        );

    const partidos =
        matches
        .filter(m =>
            m?.home?.name &&
            m?.away?.name
        )
        .map(m => ({

            fotmobMatchId: parseInt(m.id),

            homeTeam: m.home.name,

            awayTeam: m.away.name,

            homeTeamId:
                parseInt(m.home.id),

            awayTeamId:
                parseInt(m.away.id),

            resultado:
                convertirResultado(m),

            startTime:
                m.status?.utcTime
                || new Date().toISOString(),

            round:
                m.round || null

        }));

    console.log(
        "Partidos obtenidos:",
        partidos.length
    );

    return partidos;

}

function convertirResultado(match) {

    if (!match.status)
        return null;

    if (match.status.scoreStr) {

        const parts =
            match.status.scoreStr.split("-");

        if (parts.length !== 2)
            return null;

        const home =
            parseInt(parts[0]);

        const away =
            parseInt(parts[1]);

        if (home > away)
            return "LOCAL";

        if (home < away)
            return "VISITA";

        return "EMPATE";

    }

    if (
        match.home?.score != null &&
        match.away?.score != null
    ) {

        const home =
            match.home.score;

        const away =
            match.away.score;

        if (home > away)
            return "LOCAL";

        if (home < away)
            return "VISITA";

        return "EMPATE";

    }

    return null;

}
