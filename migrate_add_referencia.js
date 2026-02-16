import db from './src/config/database.js';

console.log("Migrating database...");

db.run("ALTER TABLE participaciones ADD COLUMN referenciaPago TEXT", (err) => {
    if (err) {
        if (err.message.includes("duplicate column name")) {
            console.log("Column referenciaPago already exists.");
        } else {
            console.error("Error adding column:", err);
        }
    } else {
        console.log("Column referenciaPago added successfully.");
    }
});
