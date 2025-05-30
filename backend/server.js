const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const base64url = require("base64url");
const cookieParser = require("cookie-parser");
app.use(cookieParser()); // <== add this above session
const session = require("express-session");

require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,                
    ssl: {
        rejectUnauthorized: false  
    },
      connectTimeout: 100000     // (optional) set a longer timeout (10 sec)
  });



app.use(
  session({
    name: "connect.sid", // optional: sets the session cookie name
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false, // changed from true
    cookie: {
      secure: false, // true if HTTPS
      httpOnly: true,
      sameSite: "lax", // try lax first, if still fails then 'none'
    },
  })
);

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");


const allowedOrigins = [
  'http://localhost:5173', // for local dev
  'https://classtrack.vercel.app', // for production custom domain (optional)
  'https://classtrack-git-main-manasvasanas-projects.vercel.app', // your preview/deployed Vercel domain
];

app.use(cors({ origin: true, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


function generateUniqueCode(callback) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  function tryGenerate() {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    db.query(
      "SELECT * FROM classes WHERE class_code = ?",
      [code],
      (err, results) => {
        if (err) return callback(err);
        if (results.length > 0) return tryGenerate(); // try again
        return callback(null, code); // found unique
      }
    );
  }

  tryGenerate();
}

app.get("/getTClassDetails/:class_id", (req, res) => {
  const class_id = req.params.class_id;

  const query = `
    SELECT c.id, c.name, c.class_code, u.name AS teacher_name,
           COUNT(cs.student_id) AS student_count
    FROM classes c
    JOIN users u ON c.teacher_id = u.id
    LEFT JOIN class_students cs ON c.id = cs.class_id
    WHERE c.id = ?
    GROUP BY c.id
  `;
  db.query(query, [class_id], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (result.length === 0)
      return res.status(404).json({ message: "Class not found" });
    return res.status(200).json(result[0]);
  });
});

app.get("/getTClass_attend_table_details/:class_id", (req, res) => {
  const class_id = req.params.class_id;
  console.log("class_id", class_id);

  const query = `
        SELECT 
          cs.student_id,
          u.name AS student_name,
          s.id AS session_id,
          DATE(s.started_at) AS session_date,  
          CASE 
            WHEN ar.id IS NOT NULL THEN 'Present'
            ELSE 'Absent'
          END AS attendance_status
        FROM attendance_sessions s
        JOIN class_students cs ON cs.class_id = s.class_id
        JOIN users u ON u.id = cs.student_id
        LEFT JOIN attendance_records ar 
          ON ar.session_id = s.id AND ar.student_id = cs.student_id
        WHERE s.class_id = ?
        ORDER BY cs.student_id, s.started_at
  `;
  db.query(query, [class_id], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (result.length === 0) return res.status(200).json([]); // return empty array, not 404

    return res.status(200).json(result);
  });
});


// Registration Options
app.post("/generate-registration-options", async (req, res) => {
  const { username } = req.body;
  console.log("📩 Registration options requested by:", username);

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  db.query(
    "SELECT id, name FROM users WHERE username = ?",
    [username],
    async (err, result) => {
      if (err) {
        console.error("❌ DB error (user lookup):", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length === 0) {
        console.log("❗ No user found:", username);
        return res.status(404).json({ error: "User not found" });
      }

      const user = result[0];

      try {
        const options = await generateRegistrationOptions({
          rpName: "ClassTrack",
          rpID: "localhost",
          userID: Buffer.from(String(user.id), "utf-8"),
          userName: username,
          userDisplayName: user.name,
          timeout: 60000,
          attestationType: "none",
          authenticatorSelection: {
            userVerification: "required",
            residentKey: "required",
          },
        });

        req.session.currentChallenge = options.challenge;

        console.log("✅ Registration options sent:", options);
        res.json(options);
      } catch (error) {
        console.error("❌ Failed to generate registration options:", error);
        res
          .status(500)
          .json({ error: "Failed to generate registration options" });
      }
    }
  );
});

// Authentication Options
app.post("/generate-authentication-options", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  db.query(
    "SELECT id FROM users WHERE username = ?",
    [username],
    (err, result) => {
      if (err || result.length === 0) {
        console.error("User lookup failed:", err);
        return res.status(400).json({ error: "User not found" });
      }

      const user_id = result[0].id;

      db.query(
        "SELECT credential_id FROM authenticators WHERE user_id = ?",
        [user_id],
        async (err2, rows) => {
          if (err2) {
            console.error("Credential fetch failed:", err2);
            return res
              .status(500)
              .json({ error: "Internal error fetching credentials" });
          }

          if (rows.length === 0) {
            console.log("⚠️ No authenticators found for user_id", user_id);
            return res.json({ registrationRequired: true });
          }

          // ✅ Use credential_id as-is — it's already base64url encoded

          const allowCredentials = rows
            .map((row) => {
              try {
                // Convert base64url string from DB into a Buffer
                const bufferId = base64url.toBuffer(row.credential_id);
                return {
                  id: row.credential_id, 
                  type: "public-key",
                  transports: ["internal"], // Optional
                };
              } catch (e) {
                console.error(
                  "❌ Failed to decode credential_id:",
                  row.credential_id
                );
                return null;
              }
            })
            .filter(Boolean);

            console.log(allowCredentials);
          if (allowCredentials.length === 0) {
            return res.json({ registrationRequired: true });
          }

          const options = await generateAuthenticationOptions({
            timeout: 60000,
            rpID: "localhost",
            userVerification: "preferred",
            allowCredentials,
          });

          req.session.currentChallenge = options.challenge;
          req.session.save(() => {
            console.log("✅ Challenge saved in session");
            console.log(
              "Expected challenge from session:",
              req.session.currentChallenge
            );
            res.json(options); // Will include Buffer, which frontend can use
          });
        }
      );
    }
  );
});

// Verify Registration
app.post("/verify-registration", async (req, res) => {
  const { username, attestationResponse } = req.body;

  if (!attestationResponse) {
    return res.status(400).json({ error: "Missing attestation response" });
  }

  db.query(
    "SELECT id FROM users WHERE username = ?",
    [username],
    async (err, result) => {
      if (err) {
        console.error("❌ DB error (user lookup):", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (result.length === 0) {
        return res.status(400).json({ error: "User not found" });
      }

      const user_id = result[0].id;

      try {
        console.log("🟡 Starting registration verification...");

        const verification = await verifyRegistrationResponse({
          response: attestationResponse,
          expectedChallenge: req.session.currentChallenge,
          expectedOrigin: "http://localhost:5173",
          expectedRPID: "localhost",
        });

        console.log("🟢 Verification result:", verification);

        if (!verification.verified) {
          console.error("❌ Registration failed:", verification);
          return res
            .status(403)
            .json({ error: "WebAuthn verification failed" });
        }

        const {
          credential: {
            id: credentialID,
            publicKey: credentialPublicKey,
            counter,
          },
        } = verification.registrationInfo || {};

        if (!credentialID || !credentialPublicKey) {
          return res.status(400).json({ error: "Missing credential data" });
        }

        const credentialIDEncoded = base64url.encode(Buffer.from(credentialID));
        const publicKeyEncoded = base64url.encode(
          Buffer.from(credentialPublicKey)
        );

        db.query(
          "INSERT INTO authenticators (user_id, credential_id, public_key, counter) VALUES (?, ?, ?, ?)",
          [user_id, credentialIDEncoded, publicKeyEncoded, counter],
          (insertErr) => {
            if (insertErr) {
              console.error("❌ Failed to save authenticator:", insertErr);
              return res
                .status(500)
                .json({ error: "Failed to save authenticator" });
            }

            console.log("✅ Authenticator registered for:", username);
            res.json({ success: true });
          }
        );
      } catch (e) {
        console.error("❌ Exception during registration verification:", e);
        return res
          .status(400)
          .json({ error: "Registration verification failed" });
      }
    }
  );
});

// app.post("/generate-authentication-options", (req, res) => {
//   const { username } = req.body;

//   if (!username) {
//     return res.status(400).json({ error: "Missing username" });
//   }

//   db.query(
//     "SELECT id FROM users WHERE username = ?",
//     [username],
//     (err, result) => {
//       if (err || result.length === 0) {
//         console.error("User lookup failed:", err);
//         return res.status(400).json({ error: "User not found" });
//       }

//       const user_id = result[0].id;

//       db.query(
//         "SELECT credential_id FROM authenticators WHERE user_id = ?",
//         [user_id],
//         (err2, rows) => {
//           if (err2) {
//             console.error("Credential fetch failed:", err2);
//             return res
//               .status(500)
//               .json({ error: "Internal error fetching credentials" });
//           }

//           if (rows.length === 0) {
//             // No registered authenticator, frontend must register
//             return res.json({ registrationRequired: true });
//           }

//           let allowCredentials = [];

//           try {
//             allowCredentials = rows
//               .map((row) => {
//                 if (!row.credential_id) {
//                   console.warn(
//                     "⚠️ Skipping undefined credential_id for user_id:",
//                     user_id
//                   );
//                   return null;
//                 }

//                 let idBuffer;

//                 if (typeof row.credential_id === "string") {
//                   // It's base64url encoded in DB
//                   idBuffer = base64url.toBuffer(row.credential_id);
//                 } else if (Buffer.isBuffer(row.credential_id)) {
//                   // Already a Buffer (maybe stored directly as binary)
//                   idBuffer = row.credential_id;
//                 } else {
//                   console.error(
//                     "❌ Unexpected credential_id type:",
//                     typeof row.credential_id
//                   );
//                   return null;
//                 }

//                 return {
//                   id: idBuffer,
//                   type: "public-key",
//                   transports: ["internal"],
//                 };
//               })
//               .filter(Boolean);
//           } catch (error) {
//             console.error("❌ Failed to parse credential_id(s):", error);
//             return res.status(500).json({ error: "Invalid credential format" });
//           }

//           const options = generateAuthenticationOptions({
//             timeout: 60000,
//             rpID: "localhost", // Must match the domain or IP of the RP
//             userVerification: "preferred",
//             allowCredentials,
//           });

//           req.session.currentChallenge = options.challenge;

//           console.log(
//             "Expected challenge from session:",
//             req.session.currentChallenge
//           );

//           res.json(options);
//         }
//       );
//     }
//   );
// });

app.post("/markAttendance", (req, res) => {
  console.log("📩 Marking attendance with body:", req.body);
  const {
    class_id,
    student_username,
    attendance_code,
    student_lat,
    student_lng,
    auth_response, // WebAuthn response from client
  } = req.body;

  if (!auth_response) {
    return res.status(400).json({ message: "Missing WebAuthn response" });
  }

  const getStudent = `SELECT id FROM users WHERE username = ? AND role = 'student'`;

  db.query(getStudent, [student_username], (err, studentResult) => {
    if (err || studentResult.length === 0) {
      console.error("Student lookup failed:", err);
      return res
        .status(500)
        .json({ message: "Student lookup failed, try later" });
    }

    const student_id = studentResult[0].id;

    const getSession = `
      SELECT id, teacher_lat, teacher_lng FROM attendance_sessions 
      WHERE class_id = ? AND attendance_code = ? AND is_active = 1
    `;

    db.query(getSession, [class_id, attendance_code], (err, sessionResult) => {
      if (err || sessionResult.length === 0) {
        console.error("Session lookup failed:", err);
        return res
          .status(404)
          .json({ message: "Invalid or inactive session/code" });
      }

      const session = sessionResult[0];

      const distance = haversineDistance(
        session.teacher_lat,
        session.teacher_lng,
        student_lat,
        student_lng
      );

      console.log(`Distance: ${distance.toFixed(2)} meters`);

      if (distance > 200) {
        return res
          .status(403)
          .json({ message: "You are not within 200m of the Class" });
      }

      const getAuth = `SELECT * FROM authenticators WHERE user_id = ?`;

      db.query(getAuth, [student_id], async (err, authResult) => {
        if (err || authResult.length === 0) {
          console.error("Authenticator not found:", err);
          return res.status(403).json({
            message: "No registered authenticator",
          });
        }

        const authenticator = authResult[0];
        console.log("Authenticator found:", authenticator);

        let verification;
        try {
          verification = await verifyAuthenticationResponse({
            response: auth_response,
            expectedChallenge: req.session.currentChallenge,
            expectedOrigin: "http://localhost:5173", // Frontend origin
            expectedRPID: "localhost", // Change to domain in prod
            authenticator: {
              credentialID: Buffer.from(
                authenticator.credential_id,
                "base64url"
              ),
              credentialPublicKey: Buffer.from(
                authenticator.public_key,
                "base64url"
              ),
              counter: authenticator.counter,
            },
          });
        } catch (e) {
          console.error("WebAuthn verification error:", e);
          return res
            .status(403)
            .json({ message: "WebAuthn verification failed" });
        }

        if (!verification.verified) {
          return res.status(403).json({
            message: "Authentication failed. Cannot mark attendance.",
          });
        }

        // Update counter
        const newCounter = verification.authenticationInfo.newCounter;
        db.query(
          "UPDATE authenticators SET counter = ? WHERE id = ?",
          [newCounter, authenticator.id],
          (err) => {
            if (err) console.error("Failed to update counter:", err);
          }
        );

        // Check if already marked
        const checkAttendance = `
          SELECT * FROM attendance_records WHERE session_id = ? AND student_id = ?
        `;

        db.query(checkAttendance, [session.id, student_id], (err, results) => {
          if (err) {
            console.error("Failed to check attendance record:", err);
            return res
              .status(500)
              .json({ message: "Failed to check attendance" });
          }

          if (results.length > 0) {
            return res.status(400).json({
              message: "Your attendance has already been marked",
            });
          } else {
            const insertAttendance = `
              INSERT INTO attendance_records (session_id, student_id) VALUES (?, ?)
            `;
            db.query(
              insertAttendance,
              [session.id, student_id],
              (err, result) => {
                if (err) {
                  console.error("Failed to insert attendance:", err);
                  return res
                    .status(500)
                    .json({ message: "Failed to mark attendance" });
                }

                console.log("Attendance marked successfully");
                return res
                  .status(200)
                  .json({ message: "Attendance marked successfully" });
              }
            );
          }
        });
      });
    });
  });
});

app.post("/startAttendance", (req, res) => {
  const { class_id, teacher_lat, teacher_lng } = req.body;
  const today = new Date().toISOString().slice(0, 10);

  const checkQuery = `
    SELECT * FROM attendance_sessions 
    WHERE class_id = ? 
      AND DATE(started_at) = ? 
  `;

  db.query(checkQuery, [class_id, today], (err, results) => {
    if (err) {
      console.error("DB error while checking today's session:", err);
      return res
        .status(500)
        .json({ message: "DB error while checking session" });
    }

    if (results.length > 0) {
      return res
        .status(400)
        .json({ message: "You have already started a session today" });
    }

    generateUniqueCode((err, code) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error generating attendance code" });

      const insertQuery = `
      INSERT INTO attendance_sessions (class_id, attendance_code, teacher_lat, teacher_lng, is_active)
      VALUES (?, ?, ?, ?, 1)
    `;
      db.query(
        insertQuery,
        [class_id, code, teacher_lat, teacher_lng],
        (err, result) => {
          if (err)
            return res
              .status(500)
              .json({ message: "DB error while starting session" });
          return res.status(200).json({ message: "Class started", code });
        }
      );
    });
  });
});

app.post("/stopAttendance", (req, res) => {
  const { class_id } = req.body;

  const updateQuery = `UPDATE attendance_sessions SET is_active = 0 WHERE class_id = ? AND is_active = 1`;
  db.query(updateQuery, [class_id], (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ message: "DB error while stopping session" });
    return res.status(200).json({ message: "Class stopped" });
  });
});

function haversineDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) {
    return (x * Math.PI) / 180;
  }
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.get("/GetClasses/:username", (req, res) => {
  const username = req.params.username;

  const getUser = "SELECT id, role FROM users WHERE username = ?";
  db.query(getUser, [username], (err, userResult) => {
    if (err) return res.status(500).json({ message: "DB error (user)" });
    if (userResult.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = userResult[0];

    if (user.role === "teacher") {
      const teacherQuery = `
        SELECT c.id, c.name, c.class_code, u.name AS teacher_name,
               COUNT(cs.student_id) AS student_count
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        LEFT JOIN class_students cs ON c.id = cs.class_id
        WHERE c.teacher_id = ?
        GROUP BY c.id
      `;
      db.query(teacherQuery, [user.id], (err, result) => {
        if (err) return res.status(500).json({ message: "DB error (classes)" });
        return res.status(200).json(result);
      });
    } else if (user.role === "student") {
      const studentQuery = `
        SELECT c.id, c.name, c.class_code, u.name AS teacher_name,
               COUNT(cs2.student_id) AS student_count
        FROM class_students cs
        JOIN classes c ON cs.class_id = c.id
        JOIN users u ON c.teacher_id = u.id
        LEFT JOIN class_students cs2 ON c.id = cs2.class_id
        WHERE cs.student_id = ?
        GROUP BY c.id
      `;
      db.query(studentQuery, [user.id], (err, result) => {
        if (err) return res.status(500).json({ message: "DB error (classes)" });
        return res.status(200).json(result);
      });
    }
  });
});

app.post("/JoinClass", (req, res) => {
  const { class_code, student_username } = req.body;

  // Get student ID
  const getStudent =
    "SELECT id FROM users WHERE username = ? AND role = 'student'";
  db.query(getStudent, [student_username], (err, studentResult) => {
    if (err) return res.status(500).json({ message: "DB error (student)" });
    if (studentResult.length === 0)
      return res.status(404).json({ message: "Student not found" });

    const student_id = studentResult[0].id;

    // Get class ID from code
    const getClass = "SELECT id FROM classes WHERE class_code = ?";
    db.query(getClass, [class_code], (err, classResult) => {
      if (err) return res.status(500).json({ message: "DB error (class)" });
      if (classResult.length === 0)
        return res.status(404).json({ message: "Class not found" });

      const class_id = classResult[0].id;

      // Check if already joined
      const checkQuery =
        "SELECT * FROM class_students WHERE class_id = ? AND student_id = ?";
      db.query(checkQuery, [class_id, student_id], (err, existing) => {
        if (err) return res.status(500).json({ message: "DB error (check)" });
        if (existing.length > 0)
          return res.status(409).json({ message: "Already joined this class" });

        // Insert into class_students
        const insert =
          "INSERT INTO class_students (class_id, student_id) VALUES (?, ?)";
        db.query(insert, [class_id, student_id], (err, result) => {
          if (err) return res.status(500).json({ message: "Join failed" });
          return res
            .status(200)
            .json({ message: "Successfully joined the class" });
        });
      });
    });
  });
});

app.post("/CreateClass", (req, res) => {
  const { name, teacher_username } = req.body;

  const getTeacherQuery =
    "SELECT id FROM users WHERE username = ? AND role = 'teacher'";
  db.query(getTeacherQuery, [teacher_username], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (results.length === 0)
      return res.status(404).json({ message: "Teacher not found" });

    const teacher_id = results[0].id;

    generateUniqueCode((err, class_code) => {
      if (err)
        return res.status(500).json({ message: "Error generating class code" });

      const insertQuery = `
        INSERT INTO classes (name, class_code, teacher_id)
        VALUES (?, ?, ?)
      `;
      db.query(insertQuery, [name, class_code, teacher_id], (err, result) => {
        if (err)
          return res.status(500).json({ message: "Error inserting class" });
        return res
          .status(200)
          .json({ message: "Class created successfully", class_code });
      });
    });
  });
});

app.post("/Login", (req, res) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], async (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash); // assuming password is hashed

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login success",
      name: user.name,
      role: user.role,
      username: user.username,
    });
  });
});

app.post("/SignUp", async (req, res) => {
  const { name, role, username, password_hash } = req.body;

  if (role !== "student" && role !== "teacher") {
    return res
      .status(400)
      .send('Invalid role. Must be "student" or "teacher".');
  }

  try {
    // Check if username already exists
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

      // Proceed with hashing and inserting
      const hashedPassword = await bcrypt.hash(password_hash, 10);
      const insertQuery = `
        INSERT INTO users (name, username, password_hash, role)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        insertQuery,
        [name, username, hashedPassword, role],
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
