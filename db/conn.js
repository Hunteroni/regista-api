import sqlite3 from "sqlite3"

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

export default db