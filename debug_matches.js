import db from "./src/config/database.js";

async function checkMatches() {
    try {
        console.log("Checking Rounds...");
        const { rows } = await db.query(`
            SELECT round, status, COUNT(*) as count 
            FROM matches 
            WHERE round IN (17, 7, 6) 
            GROUP BY round, status
        `);
        console.log(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMatches();
