const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.MYSQL_ROOT_PASSWORD || "rootpassword",
  database: process.env.DB_NAME || "photoshop_db"
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected");
});

// Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Upload API
app.post("/upload", upload.single("file"), (req, res) => {
  const filePath = "/uploads/" + req.file.filename;

  db.query("INSERT INTO files (path) VALUES (?)", [filePath]);

  res.json({ path: filePath });
});

app.listen(3000, () => console.log("Server running on 3000"));