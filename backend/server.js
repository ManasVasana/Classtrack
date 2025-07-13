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
const nodemailer = require("nodemailer");
const { isoBase64URL } = require("@simplewebauthn/server/helpers");
const GetStudentClassDetails = require("./routes/Student_class.js");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const { is } = require("type-is");
const { async } = require("postcss-js");

require("dotenv").config();

const db = require("./utils/db.js");

const isLocalTesting = process.env.LocalTesting === "true";

app.use(
  session({
    name: "connect.sid",
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isLocalTesting ? false : true,
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

const allowedOrigins = [
  "http://localhost:5173", // local development
  "https://classtrack.vercel.app", // optional preview
  "https://classtrack-chi.vercel.app", // optional preview
  "https://www.classtrack.me", // production
];

app.use(
  cors({
    origin: true,
    credentials: true, // for cookies (sessions, JWTs)
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
        if (results.length > 0) return tryGenerate();
        return callback(null, code);
      }
    );
  }

  tryGenerate();
}
app.use("/", authRoutes);
app.use("/", GetUserInfo);
app.use("/", GetStudentClassDetails);

app.get("/isClassActive", verifyJWT, (req, res) => {
  const class_id = req.query.class_id;
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

app.post("/verify-registration", verifyJWT, (req, res) => {
  console.log(" Registration response received:", req.body);

  const attestationResponse = req.body;

  if (!attestationResponse.id) {
    console.error(" Missing credential ID!");
    return res.status(400).json({ message: "Missing credential ID" });
  }

  // Fetch the challenge from the DB for this user
  db.query(
    "SELECT current_registeration_challenge FROM users WHERE id = ?",
    [req.user.id],
    (err, result) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const dbChallenge = result[0].current_registeration_challenge;

      verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge: dbChallenge,
        expectedOrigin: isLocalTesting
          ? "http://localhost:5173"
          : "https://www.classtrack.me",
        expectedRPID: isLocalTesting ? "localhost" : "classtrack.me",
      })
        .then((verification) => {
          console.log("Verification result:", verification);

          const { verified, registrationInfo } = verification;

          if (!verified || !registrationInfo || !registrationInfo.credential) {
            return res
              .status(400)
              .json({ message: "Invalid registration info" });
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
                console.error(
                  "Failed to save WebAuthn credentials to DB:",
                  err
                );
                return res
                  .status(500)
                  .json({ message: "Database update failed" });
              }

              console.log(
                "WebAuthn credentials saved to DB for user:",
                req.user.id
              );
              return res.status(200).json({ verified: true });
            }
          );
        })
        .catch((err) => {
          console.error("Verification failed:", err);
          return res
            .status(400)
            .json({ message: "Verification failed", error: err.toString() });
        });
    }
  );
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

      let options;
      try {
        if (typeof credential_id !== "string") {
          throw new Error("credential_id must be a string in base64url format");
        }
        options = await generateAuthenticationOptions({
          rpID: isLocalTesting ? "localhost" : "classtrack.me",
          // allowCredentials: [
          //   {
          //     id: credential_id,
          //     type: "public-key",
          //   },
          // ],
          // userVerification: "preferred",
        });

        console.log("Generated options:", options);
      } catch (err) {
        console.error("Auth Option Error:", err);
        return res.status(500).json({ message: "Failed to generate options" });
      }

      // Store the challenge in the DB
      db.query(
        "UPDATE users SET current_authentication_challenge = ? WHERE id = ?",
        [options.challenge, userId],
        (updateErr) => {
          if (updateErr) {
            console.error(
              "Failed to save authentication challenge:",
              updateErr
            );
            return res
              .status(500)
              .json({ message: "Failed to save challenge" });
          }
          return res.json(options);
        }
      );
    }
  );
});

app.post("/verify-authentication", verifyJWT, (req, res) => {
  const userId = req.user.id;
  const { auth_response } = req.body;

  // Fetch credential info and challenge from DB
  db.query(
    "SELECT credential_id, public_key, auth_counter, current_authentication_challenge FROM users WHERE id = ?",
    [userId],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ message: "DB error" });
      }

      const {
        credential_id,
        public_key,
        auth_counter,
        current_authentication_challenge,
      } = results[0];

      console.log("auth_response:", auth_response);
      console.log("challenge (from DB):", current_authentication_challenge);

      try {
        const verification = await verifyAuthenticationResponse({
          expectedChallenge: current_authentication_challenge,
          expectedOrigin: isLocalTesting
            ? "http://localhost:5173"
            : "https://www.classtrack.me",
          expectedRPID: isLocalTesting ? "localhost" : "classtrack.me",
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
          "UPDATE users SET is_device_verified = ?, auth_counter = ? WHERE id = ?",
          [true,verification.authenticationInfo.newCounter, userId],
          (updateErr) => {
            if (updateErr) {
              console.error("Failed to update counter:", updateErr);
            }
            req.session.deviceVerified = true;
            return res.json({ success: true });
          }
        );
      } catch (err) {
        console.error("Authentication verification failed:", err);
        return res
          .status(400)
          .json({ message: "Authentication failed", error: err.toString() });
      }
    }
  );
});

app.post("/markAttendance", verifyJWT, (req, res) => {
  const { class_id, attendance_code, student_lat, student_lng } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371000;
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

  // Step 1: Get student from DB
  db.query(
    "SELECT id, username, credential_id, public_key, is_device_verified FROM users WHERE id = ?",
    [userId],
    (err, userResult) => {
      if (err || userResult.length === 0) {
        return res.status(500).json({ message: "User not found" });
      }

      const student = userResult[0];

      // Step 2: Registration check
      if (!student.credential_id || !student.public_key) {
        generateRegistrationOptions({
          rpName: "ClassTrack",
          rpID: isLocalTesting ? "localhost" : "classtrack.me",
          userID: Buffer.from(userId.toString()),
          userName: student.username,
          attestationType: "none",
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "required",
            requireResidentKey: true,
          },
        }).then((options) => {
          const challenge = options.challenge;

          db.query(
            "UPDATE users SET current_registeration_challenge = ? WHERE id = ?",
            [challenge, userId],
            (err2) => {
              if (err2) {
                console.error("Error saving registration challenge:", err2);
                return res
                  .status(500)
                  .json({ message: "Error saving registration challenge" });
              }

              return res.status(206).json({
                step: "register",
                registrationOptions: options,
              });
            }
          );
        });
        return;
      }

      // Step 3: Get active attendance session
      db.query(
        "SELECT id, teacher_lat, teacher_lng FROM attendance_sessions WHERE class_id = ? AND attendance_code = ? AND is_active = 1",
        [class_id, attendance_code],
        (err3, sessionResults) => {
          if (err3 || sessionResults.length === 0) {
            return res.status(404).json({ message: "Invalid code/session" });
          }

          const session = sessionResults[0];
          const distance = haversineDistance(
            session.teacher_lat,
            session.teacher_lng,
            student_lat,
            student_lng
          );

          if (distance > 100) {
            return res.status(403).json({ message: "Not within 100 meters" });
          }

          // Step 4: Check WebAuthn authentication (from DB now)
          if (!student.is_device_verified) {
            return res.status(206).json({
              step: "authenticate",
              message: "WebAuthn authentication required",
            });
          }

          // Step 5: Check if already marked
          db.query(
            "SELECT * FROM attendance_records WHERE session_id = ? AND student_id = ?",
            [session.id, userId],
            (err4, result) => {
              if (err4) {
                return res.status(500).json({ message: "DB error" });
              }

              if (result.length > 0) {
                return res.status(400).json({ message: "Already marked" });
              }

              // Step 6: Mark attendance
              db.query(
                "INSERT INTO attendance_records (session_id, student_id) VALUES (?, ?)",
                [session.id, userId],
                (err5) => {
                  if (err5) {
                    return res.status(500).json({ message: "Insert failed" });
                  }

                  // Step 7: Reset WebAuthn verification
                  db.query(
                    "UPDATE users SET is_device_verified = 0 WHERE id = ?",
                    [userId],
                    (err6) => {
                      if (err6) {
                        console.error("Failed to reset WebAuthn flag:", err6);
                      }

                      return res.json({
                        message: "Attendance marked successfully",
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});


app.post("/startAttendance", verifyJWT, (req, res) => {
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

app.post("/stopAttendance", verifyJWT, (req, res) => {
  const { class_id } = req.body;

  // STEP 1: Stop attendance session first for fast frontend response
  const updateQuery = `UPDATE attendance_sessions SET is_active = 0 WHERE class_id = ? AND is_active = 1`;
  db.query(updateQuery, [class_id], (err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "DB error while stopping session" });
    }

    res.status(200).json({ message: "Class stopped" });

    // STEP 2: Now updating counter and run warning logic
    const counterQuery = `SELECT frequency_rate, counter FROM classes WHERE id = ?`;
    db.query(counterQuery, [class_id], (err, result) => {
      if (err || result.length === 0) {
        console.error("DB error while fetching counter:", err);
        return;
      }

      let count = result[0].counter;
      const frequencyRate = result[0].frequency_rate;

      if (frequencyRate == count + 1) {
        setImmediate(() => {
          checkLowAttendanceAndSendWarnings(class_id);
        });
        count = 0;
      } else {
        count += 1;
      }

      const updateCounterQuery = `UPDATE classes SET counter = ? WHERE id = ?`;
      db.query(updateCounterQuery, [count, class_id], (err) => {
        if (err) {
          console.error("DB error while updating counter:", err);
        }
      });
    });
  });
});

const checkLowAttendanceAndSendWarnings = (class_id) => {
  console.log("Checking low attendance for class_id:", class_id);

  const classQuery = `
    SELECT c.name, c.attendance_limit, c.frequency_rate
    FROM classes c
    WHERE c.id = ?
  `;

  db.query(classQuery, [class_id], (err, result) => {
    if (err) {
      console.error("DB error while checking attendance:", err);
      return;
    }

    if (result.length === 0) {
      console.log("No class found with the given class_id");
      return;
    }

    const { attendance_limit: attendanceLimit, name: className } = result[0];
    console.log("Class Info:", result[0]);

    const emailQuery = `
 SELECT 
  u.id AS student_id, 
  u.username, 
  u.email,
  COUNT(ar.id) AS sessions_attended,
  total_sessions.total_sessions,
  ROUND(COUNT(ar.id) * 100.0 / total_sessions.total_sessions, 2) AS attendance_percentage
FROM class_students cs
JOIN users u ON cs.student_id = u.id
LEFT JOIN attendance_records ar 
  ON ar.student_id = cs.student_id 
  AND ar.session_id IN (
    SELECT id FROM attendance_sessions WHERE class_id = ?
  )
JOIN (
  SELECT COUNT(*) AS total_sessions 
  FROM attendance_sessions 
  WHERE class_id = ?
) AS total_sessions
WHERE cs.class_id = ?
GROUP BY u.id, u.username, u.email, total_sessions.total_sessions
HAVING attendance_percentage < ?;`;

    db.query(
      emailQuery,
      [class_id, class_id, class_id, attendanceLimit],
      (err, results) => {
        if (err) {
          console.error("DB error while fetching students:", err);
          return;
        }

        if (results.length === 0) {
          console.log("No students found with low attendance");
          return;
        }

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        results.forEach((student) => {
          const { username, email, attendance_percentage } = student;

          console.log("Sending email to:", email);

          const mailOptions = {
            from: `"ClassTrack Notifications" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Low Attendance Warning for ${className}`,
            html: `
            <p>Dear <strong>${username}</strong>,</p>
            <p>This is a gentle reminder that your current attendance in <strong>${className}</strong> is <strong>${attendance_percentage}%</strong>, which is below the minimum requirement of <strong>${attendanceLimit}%</strong>.</p>
            <p>Kindly ensure that you attend upcoming classes to meet the attendance criteria.</p>
            <p>If you believe this is an error, please contact your class coordinator.</p>
            <br/>
            <p>Regards,<br/>ClassTrack Team</p>
          `,
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error(`Failed to send email to ${email_id}:`, error);
            } else {
              console.log(
                `Email sent to ${username} (${email_id}): Attendance ${attendance_percentage}%`
              );
            }
          });
        });
      }
    );
  });
};

app.get("/GetClasses", verifyJWT, (req, res) => {
  console.log("Authenticated user:", req.user);
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
  SELECT 
    c.id, 
    c.name, 
    c.class_code, 
    u.username AS teacher_name,
    COUNT(cs2.student_id) AS student_count,
    IFNULL(p.present_count, 0) AS present_sessions,
    IFNULL(s.total_sessions, 0) AS total_sessions
  FROM class_students cs
  JOIN classes c ON cs.class_id = c.id
  JOIN users u ON c.teacher_id = u.id
  LEFT JOIN class_students cs2 ON c.id = cs2.class_id
  LEFT JOIN (
    SELECT class_id, COUNT(*) AS total_sessions
    FROM attendance_sessions
    GROUP BY class_id
  ) s ON s.class_id = c.id
  LEFT JOIN (
    SELECT s.class_id, COUNT(r.id) AS present_count
    FROM attendance_sessions s
    JOIN attendance_records r ON r.session_id = s.id
    WHERE r.student_id = ?
    GROUP BY s.class_id
  ) p ON p.class_id = c.id
  WHERE cs.student_id = ?
  GROUP BY c.id;
`;

      db.query(studentQuery, [user.id, user.id], (err, result) => {
        if (err) return res.status(500).json({ message: "DB error (classes)" });
        return res.status(200).json(result);
      });
    } else {
      return res.status(401).json({ message: "Token is invalid or expired" });
    }
  });
});

app.post("/CreateClass", verifyJWT, (req, res) => {
  const { name, frequency_rate, attendance_limit } = req.body;
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
        INSERT INTO classes (name, class_code, teacher_id, attendance_limit, frequency_rate)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(
        insertQuery,
        [name, class_code, teacher_id, attendance_limit, frequency_rate],
        (err, result) => {
          if (err)
            return res.status(500).json({ message: "Error inserting class" });
          return res
            .status(200)
            .json({ message: "Class created successfully", class_code });
        }
      );
    });
  });
});

app.post("/JoinClass", verifyJWT, (req, res) => {
  console.log("Authenticated user:", req.user);
  console.log("Request body:", req.body);
  const { class_code } = req.body;
  const student_username = req.user.username;

  const getStudent =
    "SELECT id FROM users WHERE username = ? AND role = 'student'";
  db.query(getStudent, [student_username], (err, studentResult) => {
    console.log("Student query result:", studentResult);
    if (err) return res.status(500).json({ message: "DB error (student)" });
    if (studentResult.length === 0)
      return res.status(404).json({ message: "Student not found" });

    const student_id = studentResult[0].id;

    const getClass = "SELECT id FROM classes WHERE class_code = ?";
    db.query(getClass, [class_code], (err, classResult) => {
      if (err) return res.status(500).json({ message: "DB error (class)" });
      if (classResult.length === 0)
        return res.status(201).json({ message: "Class not found" });

      const class_id = classResult[0].id;

      const checkQuery =
        "SELECT * FROM class_students WHERE class_id = ? AND student_id = ?";
      db.query(checkQuery, [class_id, student_id], (err, existing) => {
        if (err) return res.status(500).json({ message: "DB error (check)" });
        if (existing.length > 0)
          return res.status(409).json({ message: "Already joined this class" });

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

app.post("/UpdateAttendance", (req, res) => {
  const { student_id, session_id, attendanceStatus, date } = req.body;

  if (!session_id || !student_id || !date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  console.log("UpdateAttendance:", {
    session_id,
    student_id,
    attendanceStatus,
    date,
  });

  if (attendanceStatus === true) {
    // DELETE if already present
    const deleteQuery = `
      DELETE FROM attendance_records
      WHERE session_id = ? AND student_id = ?
    `;
    db.query(deleteQuery, [session_id, student_id], (err, result) => {
      if (err) {
        console.error("DB error while deleting attendance:", err);
        return res.status(500).json({ message: "DB error during delete" });
      }
      console.log("Attendance record deleted");
      return res
        .status(200)
        .json({ message: "Attendance deleted successfully" });
    });
  } else {
    // INSERT a new record
    const insertQuery = `
      INSERT INTO attendance_records (session_id, student_id, marked_at)
      VALUES (?, ?, ?)
    `;
    db.query(insertQuery, [session_id, student_id, date], (err, result) => {
      if (err) {
        console.error("DB error while inserting attendance:", err);
        return res.status(500).json({ message: "DB error during insert" });
      }
      console.log("Attendance inserted");
      return res
        .status(200)
        .json({ message: "Attendance inserted successfully" });
    });
  }
});

app.get("/getsessionId", verifyJWT, (req, res) => {
  const { class_id, date } = req.query;

  if (!class_id || !date) {
    return res.status(400).json({ message: "Missing class_id or date" });
  }

  const query = `
    SELECT id FROM attendance_sessions
    WHERE class_id = ? AND DATE(started_at) = ?
  `;

  db.query(query, [class_id, date], (err, result) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "DB error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "No session found" });
    }
    return res.status(200).json({ sessionId: result[0].id });
  });
});
