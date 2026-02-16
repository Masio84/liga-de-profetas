import db from './src/config/database.js';

db.all("PRAGMA table_info(participaciones)", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(rows);
    }
});
