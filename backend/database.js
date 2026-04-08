const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "leetcode_tracker.db");
const db = new Database(dbPath);

db.exec(`
	CREATE TABLE IF NOT EXISTS questions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		questionNumber INTEGER,
		title TEXT,
		code TEXT,
		status TEXT CHECK(status IN ('solved', 'attempting', 'unsolved')),
		tag TEXT,
		date TEXT
	)
`);

module.exports = db;
