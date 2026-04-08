const fs = require("fs");
const path = require("path");

class FileDatabase {
	constructor(filePath) {
		this.filePath = filePath;
		this.state = { questions: [] };
		this.load();
	}

	load() {
		if (!fs.existsSync(this.filePath)) {
			this.save();
			return;
		}

		try {
			const raw = fs.readFileSync(this.filePath, "utf8");
			const parsed = JSON.parse(raw);
			if (parsed && Array.isArray(parsed.questions)) {
				this.state.questions = parsed.questions;
			}
		} catch {
			this.state = { questions: [] };
			this.save();
		}
	}

	save() {
		fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
	}

	normalize(sql) {
		return sql.trim().replace(/\s+/g, " ").toUpperCase();
	}

	cloneQuestion(question) {
		return { ...question };
	}

	getNextId() {
		return this.state.questions.reduce((maxId, question) => Math.max(maxId, question.id || 0), 0) + 1;
	}

	exec(sql) {
		const normalized = this.normalize(sql);
		if (!normalized.startsWith("CREATE TABLE IF NOT EXISTS QUESTIONS")) {
			throw new Error(`Unsupported SQL in exec(): ${sql}`);
		}
	}

	prepare(sql) {
		const normalized = this.normalize(sql);

		if (normalized.startsWith("INSERT INTO QUESTIONS")) {
			return {
				run: (questionNumber, title, code, status, tag, date) => {
					const row = {
						id: this.getNextId(),
						questionNumber,
						title,
						code,
						status,
						tag,
						date,
					};

					this.state.questions.push(row);
					this.save();

					return { changes: 1, lastInsertRowid: row.id };
				},
			};
		}

		if (normalized.startsWith("SELECT * FROM QUESTIONS WHERE ID = ?")) {
			return {
				get: (id) => {
					const question = this.state.questions.find((entry) => entry.id === id);
					return question ? this.cloneQuestion(question) : undefined;
				},
			};
		}

		if (normalized.startsWith("SELECT * FROM QUESTIONS ORDER BY ID DESC")) {
			return {
				all: () =>
					this.state.questions
						.slice()
						.sort((left, right) => right.id - left.id)
						.map((question) => this.cloneQuestion(question)),
			};
		}

		if (normalized.startsWith("UPDATE QUESTIONS SET")) {
			return {
				run: (questionNumber, title, code, status, tag, date, id) => {
					const index = this.state.questions.findIndex((entry) => entry.id === id);
					if (index === -1) {
						return { changes: 0 };
					}

					this.state.questions[index] = {
						...this.state.questions[index],
						questionNumber,
						title,
						code,
						status,
						tag,
						date,
					};
					this.save();

					return { changes: 1 };
				},
			};
		}

		if (normalized.startsWith("DELETE FROM QUESTIONS WHERE ID = ?")) {
			return {
				run: (id) => {
					const index = this.state.questions.findIndex((entry) => entry.id === id);
					if (index === -1) {
						return { changes: 0 };
					}

					this.state.questions.splice(index, 1);
					this.save();

					return { changes: 1 };
				},
			};
		}

		throw new Error(`Unsupported SQL: ${sql}`);
	}
}

const dbPath = path.join(__dirname, "leetcode_tracker.json");

module.exports = new FileDatabase(dbPath);
