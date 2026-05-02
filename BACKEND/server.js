require("dotenv").config(); // ✅ load env variables

const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ CORS FIX
app.use(cors({
  origin: "*",
}));

// Body limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve images
app.use("/uploads", express.static("/app/uploads"));

// 🔥 DB retry
let db;
function connectDB() {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  db.connect((err) => {
    if (err) {
      console.log("⏳ Waiting DB...");
      setTimeout(connectDB, 3000);
    } else {
      console.log("✅ DB Connected");
    }
  });
}
connectDB();

// Multer config
const storage = multer.diskStorage({
  destination: "/app/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 🔥 Upload API
app.post("/upload", upload.single("file"), (req, res) => {
  const filePath = "/uploads/" + req.file.filename;

  db.query("INSERT INTO files (path) VALUES (?)", [filePath], (err) => {
    if (err) return res.status(500).send(err);

    res.json({ path: filePath });
  });
});

// 🔥 Get all images (gallery API)
app.get("/images", (req, res) => {
  db.query("SELECT * FROM files ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.listen(3000, () => console.log("🚀 Backend running on 3000"));