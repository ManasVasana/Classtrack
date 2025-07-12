const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
app.use(cookieParser()); 
const jwt = require("jsonwebtoken");
const verifyJWT = require("../middleware/auth.js");
const db = require("../utils/db.js");
const { async } = require("postcss-js");
const query = require("esquery");

require("dotenv").config();

app.use(cors({ origin: true, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/getClassData/:class_id", verifyJWT, (req, res) => {
  const class_id = req.params.class_id; 
  console.log("Fetching class data for class_id:", class_id);
  const user_id = req.user.id;

  if (!class_id) {
    return res.status(400).json({ message: "Class ID is required" });
  }

  const query = `
SELECT 
  s.id AS session_id,
  DATE_FORMAT(s.started_at, '%d-%m-%Y') AS session_date,
  c.name AS class_name,
  CASE 
    WHEN r.id IS NOT NULL THEN 'Present'
    ELSE 'Absent'
  END AS status
FROM attendance_sessions s
JOIN classes c ON s.class_id = c.id
LEFT JOIN attendance_records r 
  ON s.id = r.session_id AND r.student_id = ?
WHERE s.class_id = ?
ORDER BY s.started_at ASC;
        `;

  db.query(query, [user_id, class_id], (err, results) => {
    if (err) {
      console.error("Error fetching class data:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No class data found" });
    }

    res.json(results);
  });
});

module.exports = app;
