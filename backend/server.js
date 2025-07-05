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
const verifyJWT = require("./middleware/auth");
const authRoutes = require("./controllers/Sign_in_up.js");
const GetUserInfo = require("./routes/profile.js");
const { isoBase64URL } = require("@simplewebauthn/server/helpers");

require("dotenv").config();

const db = require("./utils/db.js");

app.use(
  session({
    name: "connect.sid",
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // true if HTTPS
      httpOnly: true,
      sameSite: "none", // try lax first, if still fails then 'none'
    },
  })
);

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const { is } = require("type-is");

const allowedOrigins = [
  "http://localhost:5173",                  // dev
  "https://classtrack.vercel.app",          // optional preview
  "https://classtrack-chi.vercel.app",      // optional preview
  "https://www.classtrack.me",              // ✅ your production domain
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // ✅ important for cookies (sessions, JWTs)
  })
);

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
app.use("/", authRoutes); // Routes mounted on root
app.use("/", GetUserInfo); // Routes mounted on root

app.get("/isClassActive", verifyJWT, (req, res) => {
  const class_id = req.query.class_id; // ✅ FIXED
  const query = `SELECT is_active, attendance_code
FROM attendance_sessions 
WHERE class_id = ? 
ORDER BY id DESC 
LIMIT 1;
`;

  db.query(query, [class_id], (err, result) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "DB error" });
    }
    if (result.length === 0) {
      return res.status(200).json({ isActive: false, attendance_code: "" });
    }
    let isActive;
    if (result[0].is_active == 1) {
      isActive = true;
    } else {
      isActive = false;
    }

    console.log("isActive:", isActive);
    console.log("attendance_code:", result[0].attendance_code);

    return res
      .status(200)
      .json({ isActive, attendance_code: result[0].attendance_code });
  });
});

app.get("/getTClassDetails/:class_id", verifyJWT, (req, res) => {
  const class_id = req.params.class_id;

  const query = `
    SELECT c.id, c.name, c.class_code, u.username AS teacher_name,
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

app.get("/getTClass_attend_table_details/:class_id", verifyJWT, (req, res) => {
  const class_id = req.params.class_id;
  console.log("class_id", class_id);

  const query = `
        SELECT 
          cs.student_id,
          u.username AS student_name,
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

app.post("/generate-registration-options", verifyJWT, (req, res) => {
  const { id, username } = req.user;

  const options = generateRegistrationOptions({
    rpName: "ClassTrack",
    rpID: "classtrack.me", // Use your production domain here
    // rpID: "localhost", // Use for local development
    userID: Buffer.from(userId.toString()),

    userName: username,
    attestationType: "none",
    authenticatorSelection: {
      userVerification: "preferred",
      residentKey: "discouraged",
    },
  });

  req.session.challenge = options.challenge;
  res.json(options);
});

app.post("/verify-registration", verifyJWT, async (req, res) => {
  console.log(" Registration response received:", req.body);

  const attestationResponse = req.body;

  if (!attestationResponse.id) {
    console.error(" Missing credential ID!");
    return res.status(400).json({ message: "Missing credential ID" });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: req.session.currentRegistrationChallenge,
      // expectedOrigin: "http://localhost:5173",
      // expectedRPID: "localhost",
      expectedOrigin: "https://www.classtrack.me",
      expectedRPID: "classtrack.me",
    });

    console.log("Verification result:", verification);

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo || !registrationInfo.credential) {
      return res.status(400).json({ message: "Invalid registration info" });
    }

    console.log("verification:", verification);
    console.log("verificationInfo", registrationInfo);

    const credentialID = registrationInfo.credential.id;
    const publicKeyBuffer = registrationInfo.credential.publicKey;
    const credentialType = registrationInfo.credentialType;

    const updateQuery = `
  UPDATE users
  SET credential_id = ?, public_key = ?, credential_type = ?
  WHERE id = ?
`;

    db.query(
      updateQuery,
      [
        credentialID,
        isoBase64URL.fromBuffer(publicKeyBuffer),
        credentialType,
        req.user.id,
      ],
      (err, result) => {
        if (err) {
          console.error("Failed to save WebAuthn credentials to DB:", err);
          return res.status(500).json({ message: "Database update failed" });
        }

        console.log("WebAuthn credentials saved to DB for user:", req.user.id);
        res.status(200).json({ verified: true });
      }
    );
  } catch (err) {
    console.error("Verification failed:", err);
    res
      .status(400)
      .json({ message: "Verification failed", error: err.toString() });
  }
});

app.post("/generate-authentication-options", verifyJWT, async (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT credential_id, credential_type FROM users WHERE id = ?",
    [userId],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ message: "DB error" });
      }

      const { credential_id, credential_type } = results[0];
      console.log("debug:", credential_id, credential_type);

      try {
        if (typeof credential_id !== "string") {
          throw new Error("credential_id must be a string in base64url format");
        }
        const options = await generateAuthenticationOptions({
          rpID: "classtrack.me",
          allowCredentials: [
            {
              id: credential_id,
              type: "public-key",
            },
          ],
          userVerification: "preferred",
        });

        console.log("Generated options:", options);

        req.session.challenge = options.challenge;
        res.json(options);
      } catch (err) {
        console.error("Auth Option Error:", err);
        res.status(500).json({ message: "Failed to generate options" });
      }
    }
  );
});

app.post("/verify-authentication", verifyJWT, (req, res) => {
  const userId = req.user.id;
  const { auth_response } = req.body;
  const challenge = req.session.challenge;

  db.query(
    "SELECT credential_id, public_key, auth_counter FROM users WHERE id = ?",
    [userId],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ message: "DB error" });
      }

      const { credential_id, public_key, auth_counter } = results[0];

      console.log("auth_response:", auth_response);
      console.log("challenge:", challenge);

      console.log("final:", isoBase64URL.toBuffer(public_key));

      const verification = await verifyAuthenticationResponse({
        expectedChallenge: challenge,
        // expectedOrigin: "http://localhost:5173",
        // expectedRPID: "localhost",
        expectedOrigin: "https://www.classtrack.me",
        expectedRPID: "classtrack.me",
        response: auth_response,
        credential: {
          id: credential_id,
          publicKey: isoBase64URL.toBuffer(public_key),
          counter: auth_counter,
        },
      });

      if (!verification.verified) {
        return res.status(401).json({ message: "Device not verified" });
      }

      // Update the counter in the database if verification succeeded
      db.query(
        "UPDATE users SET auth_counter = ? WHERE id = ?",
        [verification.authenticationInfo.newCounter, userId],
        (updateErr) => {
          if (updateErr) {
            console.error("Failed to update counter:", updateErr);
          }
        }
      );

      req.session.deviceVerified = true;
      res.json({ success: true });
    }
  );
});

app.post("/markAttendance", verifyJWT, async (req, res) => {
  const { class_id, attendance_code, student_lat, student_lng } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

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

  const getUser = (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT id, username, credential_id, public_key FROM users WHERE id = ?",
        [userId],
        (err, result) => {
          if (err || result.length === 0) return reject("User not found");
          resolve(result[0]);
        }
      );
    });
  };

  try {
    const student = await getUser(userId);

    // Handle first-time registration
    if (!student.credential_id || !student.public_key) {
      const options = await generateRegistrationOptions({
        rpName: "ClassTrack",
        rpID: "classtrack.me",
        // rpID: "localhost", // Use for local development
        userID: Buffer.from(userId.toString()),
        userName: student.username,
        attestationType: "none",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "required",
          requireResidentKey: "required",
        },
      });

      req.session.currentRegistrationChallenge = options.challenge;

      return res
        .status(206)
        .json({ step: "register", registrationOptions: options });
    }

    // Location + session validation
    db.query(
      "SELECT id, teacher_lat, teacher_lng FROM attendance_sessions WHERE class_id = ? AND attendance_code = ? AND is_active = 1",
      [class_id, attendance_code],
      (err, sessionResult) => {
        if (err || sessionResult.length === 0) {
          return res.status(404).json({ message: "Invalid code/session" });
        }

        const session = sessionResult[0];
        const distance = haversineDistance(
          session.teacher_lat,
          session.teacher_lng,
          student_lat,
          student_lng
        );

        console.log("distance:", distance);

        if (distance > 100) {
          return res.status(403).json({ message: "Not within 100 meters" });
        }

        // Check if already verified
        if (!req.session.deviceVerified) {
          return res.status(206).json({
            step: "authenticate",
            message: "WebAuthn auth required",
          });
        }

        // Check if already marked
        db.query(
          "SELECT * FROM attendance_records WHERE session_id = ? AND student_id = ?",
          [session.id, userId],
          (err, existing) => {
            if (existing.length > 0) {
              return res.status(400).json({ message: "Already marked" });
            }

            db.query(
              "INSERT INTO attendance_records (session_id, student_id) VALUES (?, ?)",
              [session.id, userId],
              (err) => {
                if (err)
                  return res.status(500).json({ message: "Insert failed" });
                // Clear session
                req.session.deviceVerified = false;
                res.json({ message: "Attendance marked successfully" });
              }
            );
          }
        );
      }
    );
  } catch (err) {
    console.error(" markAttendance error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/startAttendance", verifyJWT, (req, res) => {
  const { class_id, teacher_lat, teacher_lng } = req.body;
  const today = new Date().toISOString().slice(0, 10);

  // const checkQuery = `
  //   SELECT * FROM attendance_sessions
  //   WHERE class_id = ?
  //     AND DATE(started_at) = ?
  // `;

  // db.query(checkQuery, [class_id, today], (err, results) => {
  //   if (err) {
  //     console.error("DB error while checking today's session:", err);
  //     return res
  //       .status(500)
  //       .json({ message: "DB error while checking session" });
  //   }

  // if (results.length > 0) {
  //   return res
  //     .status(400)
  //     .json({ message: "You have already started a session today" });
  // }

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
  // });
});

app.post("/stopAttendance", verifyJWT, (req, res) => {
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

app.get("/GetClasses", verifyJWT, (req, res) => {
  console.log("Authenticated user:", req.user); // Add this
  const userId = req.user.id;
  const getUser = "SELECT id, role FROM users WHERE id = ?";
  db.query(getUser, [userId], (err, userResult) => {
    if (err) {
      console.error("DB error (student classes):", err);
      return res.status(500).json({ message: "DB error (classes)" });
    }

    if (userResult.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = userResult[0];

    if (user.role === "teacher") {
      const teacherQuery = `
        SELECT c.id, c.name, c.class_code, u.username AS teacher_name,
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
        SELECT c.id, c.name, c.class_code, u.username AS teacher_name,
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
    } else {
      return res.status(401).json({ message: "Token is invalid or expired" });
    }
  });
});

app.post("/JoinClass", verifyJWT, (req, res) => {
  const { class_code } = req.body;
  const student_username = req.user.username;

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

app.post("/CreateClass", verifyJWT, (req, res) => {
  const { name } = req.body;
  const teacher_username = req.user.username;

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

app.post("/UpdateAttendance", (req, res) => {
  const { studentName, date, attendanceStatus } = req.body;
  console.log("Updating attendance for:", studentName, date, attendanceStatus);

  const insertQuery = `
    INSERT INTO attendance_records (student_name, session_date, attendance_status)
    VALUES (?, ?, ?)
    `;
  db.query(
    insertQuery,
    [studentName, date, attendanceStatus],
    (err, result) => {
      if (err) {
        console.error("DB error while updating attendance:", err);
        return res
          .status(500)
          .json({ message: "DB error while updating attendance" });
      }
      console.log("Attendance updated successfully");
      return res
        .status(200)
        .json({ message: "Attendance updated successfully" });
    }
  );
});
