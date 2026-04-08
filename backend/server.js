const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./database");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
	"http://localhost:3001",
	"http://127.0.0.1:3001",
	"https://dainty-pie-d200aa.netlify.app",
];

const corsOptions = {
	origin(origin, callback) {
		if (!origin || allowedOrigins.includes(origin)) {
			return callback(null, true);
		}

		return callback(new Error("CORS policy does not allow this origin"));
	},
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.post("/items", (req, res) => {
	const { questionNumber, title, code, status, tag, date } = req.body;

	const stmt = db.prepare(
		`
		INSERT INTO questions (questionNumber, title, code, status, tag, date)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	);

	const result = stmt.run(questionNumber, title, code, status, tag, date);
	const created = db.prepare("SELECT * FROM questions WHERE id = ?").get(result.lastInsertRowid);

	res.status(201).json(created);
});

app.get("/items", (req, res) => {
	const rows = db.prepare("SELECT * FROM questions ORDER BY id DESC").all();
	res.json(rows);
});

app.put("/items/:id", (req, res) => {
	const id = Number(req.params.id);
	const existing = db.prepare("SELECT * FROM questions WHERE id = ?").get(id);

	if (!existing) {
		return res.status(404).json({ message: "Item not found" });
	}

	const updatedData = {
		questionNumber:
			req.body.questionNumber !== undefined ? req.body.questionNumber : existing.questionNumber,
		title: req.body.title !== undefined ? req.body.title : existing.title,
		code: req.body.code !== undefined ? req.body.code : existing.code,
		status: req.body.status !== undefined ? req.body.status : existing.status,
		tag: req.body.tag !== undefined ? req.body.tag : existing.tag,
		date: req.body.date !== undefined ? req.body.date : existing.date,
	};

	db.prepare(
		`
		UPDATE questions
		SET questionNumber = ?, title = ?, code = ?, status = ?, tag = ?, date = ?
		WHERE id = ?
	`
	).run(
		updatedData.questionNumber,
		updatedData.title,
		updatedData.code,
		updatedData.status,
		updatedData.tag,
		updatedData.date,
		id
	);

	const updated = db.prepare("SELECT * FROM questions WHERE id = ?").get(id);
	res.json(updated);
});

app.delete("/items/:id", (req, res) => {
	const id = Number(req.params.id);
	const result = db.prepare("DELETE FROM questions WHERE id = ?").run(id);

	if (result.changes === 0) {
		return res.status(404).json({ message: "Item not found" });
	}

	res.json({ message: "Item deleted successfully" });
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
