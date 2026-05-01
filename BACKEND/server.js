const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const path = require("path");

const app = express();

// Serve uploaded images
app.use("/uploads", express.static("/app/uploads"));

// 🔥 DB connection with retry
let db;

function connectWithRetry() {
  db = mysql.createConnection({
    host: process.env.DB_HOST || "database",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "rootpassword",
    database: process.env.DB_NAME || "filedb"
  });

  db.connect((err) => {
    if (err) {
      console.log("⏳ Waiting for DB...");
      setTimeout(connectWithRetry, 3000);
    } else {
      console.log("✅ MySQL Connected");
    }
  });
}

connectWithRetry();

// 🔥 Multer storage → Docker volume
const storage = multer.diskStorage({
  destination: "/app/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 🔥 Upload API
app.post("/upload", upload.single("file"), (req, res) => {
  const filePath = "/uploads/" + req.file.filename;

  db.query(
    "INSERT INTO files (path) VALUES (?)",
    [filePath],
    (err) => {
      if (err) return res.status(500).send(err);

      res.json({ path: filePath });
    }
  );
});

app.listen(3000, () => console.log("🚀 Server running on 3000"));