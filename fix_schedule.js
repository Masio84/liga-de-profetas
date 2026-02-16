import db from "./src/config/database.js";

const rounds = {
    7: [
        { home: "Puebla", away: "Tigres UANL", date: "2026-02-20T19:00:00" },
        { home: "Atlas", away: "Mazatlan FC", date: "2026-02-20T21:00:00" },
        { home: "Club America", away: "Necaxa", date: "2026-02-21T17:00:00" },
        { home: "Leon", away: "Monterrey", date: "2026-02-21T17:00:00" },
        { home: "Cruz Azul", away: "Queretaro FC", date: "2026-02-21T19:00:00" },
        { home: "Pachuca", away: "FC Juarez", date: "2026-02-21T19:00:00" },
        { home: "Pumas UNAM", away: "Toluca", date: "2026-02-22T12:00:00" },
        { home: "Chivas Guadalajara", away: "Atletico de San Luis", date: "2026-02-22T17:00:00" },
        { home: "Santos Laguna", away: "Tijuana", date: "2026-02-22T19:00:00" }
    ],
    8: [
        { home: "Mazatlan FC", away: "Cruz Azul", date: "2026-02-27T19:00:00" },
        { home: "Necaxa", away: "Leon", date: "2026-02-27T21:00:00" },
        { home: "Monterrey", away: "Santos Laguna", date: "2026-02-28T17:00:00" },
        { home: "Toluca", away: "Atlas", date: "2026-02-28T17:00:00" },
        { home: "Tigres UANL", away: "Pachuca", date: "2026-02-28T19:00:00" },
        { home: "FC Juarez", away: "Puebla", date: "2026-02-28T19:00:00" },
        { home: "Queretaro FC", away: "Club America", date: "2026-03-01T17:00:00" },
        { home: "Atletico de San Luis", away: "Pumas UNAM", date: "2026-03-01T17:00:00" },
        { home: "Tijuana", away: "Chivas Guadalajara", date: "2026-03-01T19:00:00" }
    ],
    9: [
        { home: "Puebla", away: "Cruz Azul", date: "2026-03-06T19:00:00" },
        { home: "Atlas", away: "FC Juarez", date: "2026-03-06T21:00:00" },
        { home: "Tigres UANL", away: "Monterrey", date: "2026-03-07T17:00:00" },
        { home: "Club America", away: "Pachuca", date: "2026-03-07T17:00:00" },
        { home: "Leon", away: "Pumas UNAM", date: "2026-03-07T19:00:00" },
        { home: "Chivas Guadalajara", away: "Toluca", date: "2026-03-07T21:00:00" },
        { home: "Queretaro FC", away: "Santos Laguna", date: "2026-03-08T17:00:00" },
        { home: "Mazatlan FC", away: "Necaxa", date: "2026-03-08T17:00:00" },
        { home: "Tijuana", away: "Atletico de San Luis", date: "2026-03-08T19:00:00" }
    ],
    10: [
        { home: "Necaxa", away: "Tigres UANL", date: "2026-03-13T19:00:00" },
        { home: "Cruz Azul", away: "Atlas", date: "2026-03-13T21:00:00" },
        { home: "Monterrey", away: "Club America", date: "2026-03-14T17:00:00" },
        { home: "Toluca", away: "Leon", date: "2026-03-14T17:00:00" },
        { home: "Pumas UNAM", away: "Mazatlan FC", date: "2026-03-14T19:00:00" },
        { home: "Santos Laguna", away: "Puebla", date: "2026-03-14T19:00:00" },
        { home: "Pachuca", away: "Chivas Guadalajara", date: "2026-03-15T17:00:00" },
        { home: "FC Juarez", away: "Queretaro FC", date: "2026-03-15T19:00:00" },
        { home: "Atletico de San Luis", away: "Tijuana", date: "2026-03-15T19:00:00" }
    ],
    11: [
        { home: "Atlas", away: "Tigres UANL", date: "2026-03-20T19:00:00" },
        { home: "Leon", away: "Cruz Azul", date: "2026-03-20T21:00:00" },
        { home: "Club America", away: "Santos Laguna", date: "2026-03-21T17:00:00" },
        { home: "Monterrey", away: "Pumas UNAM", date: "2026-03-21T17:00:00" },
        { home: "Toluca", away: "Necaxa", date: "2026-03-21T19:00:00" },
        { home: "Chivas Guadalajara", away: "FC Juarez", date: "2026-03-22T17:00:00" },
        { home: "Puebla", away: "Queretaro FC", date: "2026-03-22T17:00:00" },
        { home: "Mazatlan FC", away: "Pachuca", date: "2026-03-22T19:00:00" },
        { home: "Tijuana", away: "Atletico de San Luis", date: "2026-03-22T19:00:00" }
    ]
};

db.serialize(() => {

    // 1. Get all teams to build map (Home AND Away)
    db.all("SELECT homeTeam as team, homeTeamId as id FROM matches UNION SELECT awayTeam as team, awayTeamId as id FROM matches", (err, rows) => {
        if (err) { console.error(err); return; }

        const nameToId = {};
        rows.forEach(r => {
            if (r.team && r.id) nameToId[r.team] = r.id;
        });

        // Updated Manual Map based on DB data (Step 414)
        const manualMap = {
            "América": "CF America",
            "Americas": "CF America",
            "Club America": "CF America",
            "CF America": "CF America",
            "Chivas": "Chivas", // DB has "Chivas" ? No, step 367 said Chivas, step 414 said Chivas is undefined? Wait.
            // Step 414 sample said: 'Chivas' | undefined ?? No.
            // Step 367 sample said: 'Cruz Azul' vs 'Chivas' 2026-02-22.
            // So DB has 'Chivas'.
            "Chivas Guadalajara": "Chivas",
            "Tigres": "Tigres",
            "Tigres UANL": "Tigres",
            "Pumas": "Pumas",
            "Pumas UNAM": "Pumas",
            "Santos": "Santos Laguna",
            "Santos Laguna": "Santos Laguna",
            "Juárez": "FC Juarez",
            "FC Juarez": "FC Juarez",
            "San Luis": "Atletico de San Luis",
            "Atletico de San Luis": "Atletico de San Luis",
            "Querétaro": "Queretaro FC",
            "Queretaro FC": "Queretaro FC",
            "Mazatlán": "Mazatlan FC",
            "Mazatlan FC": "Mazatlan FC",
            "Monterrey": "Monterrey",
            "León": "Leon",
            "Leon": "Leon",
            "Atlas": "Atlas",
            "Puebla": "Puebla",
            "Cruz Azul": "Cruz Azul",
            "Necaxa": "Necaxa",
            "Toluca": "Toluca",
            "Pachuca": "Pachuca",
            "Tijuana": "Tijuana"
        };

        const getId = (name) => {
            if (nameToId[name]) return nameToId[name];
            const mappedName = manualMap[name];
            if (mappedName && nameToId[mappedName]) return nameToId[mappedName];
            const key = Object.keys(nameToId).find(k => k.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.toLowerCase()));
            if (key) return nameToId[key];
            return 0; // Fallback
        };

        const roundNums = Object.keys(rounds);

        const placeholders = roundNums.map(() => '?').join(',');
        db.run(`DELETE FROM matches WHERE round IN (${placeholders})`, roundNums, (err) => {
            if (err) console.error("Error deleting:", err);
            else console.log("Deleted old matches for rounds", roundNums);

            // Removing 'status' and 'leagueId'
            const stmt = db.prepare(`INSERT INTO matches (round, homeTeam, homeTeamId, awayTeam, awayTeamId, startTime) VALUES (?, ?, ?, ?, ?, ?)`);

            roundNums.forEach(r => {
                const matchList = rounds[r];
                matchList.forEach(m => {
                    let homeName = m.home;
                    let awayName = m.away;
                    let homeId = getId(homeName);
                    let awayId = getId(awayName);

                    // Use mapped name for DB insertion to ensure consistency
                    if (manualMap[homeName]) homeName = manualMap[homeName];
                    if (manualMap[awayName]) awayName = manualMap[awayName];

                    if (homeId === 0 || awayId === 0) {
                        console.warn(`Warning: Missing ID for ${homeName} (${homeId}) or ${awayName} (${awayId})`);
                    }

                    stmt.run(
                        r,
                        homeName,
                        homeId,
                        awayName,
                        awayId,
                        new Date(m.date).toISOString()
                    );
                });
            });
            stmt.finalize();
            console.log("Inserted new matches");
        });
    });
});
