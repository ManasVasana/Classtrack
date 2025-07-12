const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const base64url = require("base64url");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const session = require("express-session");
const jwt = require("jsonwebtoken");
const verifyJWT = require("../middleware/auth.js"); 
const db = require("../utils/db.js");

require("dotenv").config();

app.use(cors({ origin: true, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/Logout", (req, res) => {
  // res.clearCookie("refreshToken", {
  //   httpOnly: true,
  //   secure: true, 
  //   sameSite: "Strict",
  // });

  return res.status(200).json({ message: "Logged out" });
});


// app.post("/refresh-token", (req, res) => {
//   const token = req.cookies.refreshToken;

//   if (!token)
//     return res.status(401).json({ message: "No refresh token provided" });

//   jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
//     if (err) return res.status(403).json({ message: "Invalid refresh token" });

//     const payload = { id: decoded.id, username: decoded.username };

//     const newAccessToken = jwt.sign(payload, process.env.JWT_secret, {
//       expiresIn: "5m",
//     });

//     return res.status(200).json({
//       token: newAccessToken,
//     });
//   });
// });


app.post("/Login", (req, res) => {

  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], async (err, results) => {

    if (err) return res.status(500).json({ message: "DB error" });
    if (results.length === 0)
      return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid Password" });

    const payload = { id: user.id, username: user.username,role: user.role};

    let accessToken;
    // let refreshToken;

    try {
      accessToken = jwt.sign(payload, process.env.JWT_secret, {
        expiresIn: "7d", // 5 minutes
      });

      // refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      //   expiresIn: "7d", // 7 days
      // });
    } catch (err) {
      console.error("JWT Signing Error:", err);
      return res.status(500).json({ message: "Token generation failed" });
    }

    // Send refresh token as secure HTTP-only cookie
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: false, // set to true if using HTTPS in production
    //   sameSite: "Strict",
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // });

    console.log("Access token:", accessToken);

    res.status(200).json({
      auth: true,
      token: accessToken,
      message: "Login success",
      name: user.name,
      role: user.role,
      username: user.username,
    });
  });
});

app.post("/SignUp", async (req, res) => {
  const { role, username, password_hash, email } = req.body;

  if (role !== "student" && role !== "teacher") {
    return res
      .status(400)
      .send('Invalid role. Must be "student" or "teacher".');
  }

  try {
    const checkUserQuery = "SELECT * FROM users WHERE username = ?";
    db.query(checkUserQuery, [username], async (err, results) => {
      if (err) {
        console.error("Database error during username check:", err);
        return res.status(500).send("Internal server error");
      }

      if (results.length > 0) {
        return res.status(409).json({
          message: "Username already exists. Please choose another one.",
        });
      }

      // Proceeding with hashing and inserting if user does not exist
      const hashedPassword = await bcrypt.hash(password_hash, 10);
      const insertQuery = `
        INSERT INTO users (username, password_hash, role, email)
        VALUES ( ?, ?, ?, ?)
      `;

      db.query(
        insertQuery,
        [username, hashedPassword, role, email],
        (err, result) => {
          if (err) {
            console.error("Database error during user insertion:", err);
            return res.status(500).send("Internal server error");
          }

          res.send("User registered successfully.");
        }
      );
    });
  } catch (error) {
    console.error("Hashing error:", error);
    res.status(500).send("Internal server error");
  }
});

module.exports = app;
