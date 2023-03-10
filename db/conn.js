import sqlite3 from "sqlite3"
import fs from "fs"


const db = new sqlite3.Database("./db/sqlite.db", (err) => {
    if (err) {
        return console.log("Make sure the database has been created")
    }
    else {
        console.log("Connected to the database")
    }
})
// Check if the table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='pl_logos'", (err, row) => {
    if (err) {
        console.error(err.message);
    }
    if (!row) {
        // If the table doesn't exist, create it
        db.run('CREATE TABLE pl_logos (team_id INTEGER PRIMARY KEY, endpoint VARCHAR(255))', (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log("Table created: pl_logos, check the documentation to correctly load the Premier League club logos");
        });
    } else {
        console.log('Table found: pl_logos, inherted old values');
    }
});
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='countries'", (err, row) => {
    if (err) {
        console.error(err.message);
    }
    if (!row) {
        // If the table doesn't exist, create it
        db.run('CREATE TABLE IF NOT EXISTS countries (num_code INTEGER NOT NULL PRIMARY KEY, alpha_2_code TEXT UNIQUE,alpha_3_code TEXT UNIQUE,en_short_name TEXT,nationality TEXT);', (err) => {
            if (err) {
                console.error(err.message);
            }
            const queryPath = './db/populate_countries.sql';
            const query = fs.readFileSync(queryPath, 'utf8');
            db.run(query, (err) => {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log('Table countries created and populated');
                }
            });
        });
    } else {
        console.log('Table found: countries, inherted old values');
    }
});

export default db