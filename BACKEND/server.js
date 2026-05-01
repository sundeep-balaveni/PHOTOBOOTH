const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const path = require("path");

const app = express();

// 🔥 Increase payload limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve uploaded files
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

// 🔥 Multer config (with limits + validation)
const storage = multer.diskStorage({
  destination: "/app/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP allowed"));
    }
    cb(null, true);
  }
});

// 🔥 Upload API
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = "/uploads/" + req.file.filename;

  db.query(
    "INSERT INTO files (path) VALUES (?)",
    [filePath],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "DB Error" });
      }

      res.json({ path: filePath });
    }
  );
});

// 🔥 Global error handler (important)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(3000, () => console.log("🚀 Server running on 3000"));