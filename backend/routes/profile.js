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

app.post("/DeleteAccount", verifyJWT, (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    console.error("Missing or invalid user ID in request");
    return res.status(401).json({ message: "Unauthorized: missing user ID" });
  }

  console.log("Initiating account deletion for user:", userId);

  db.getConnection((err, conn) => {
    if (err) {
      console.error("DB connection error:", err);
      return res.status(500).json({ message: "Failed to get DB connection" });
    }

    conn.beginTransaction((err) => {
      if (err) {
        conn.release();
        console.error("Transaction start error:", err);
        return res.status(500).json({ message: "Transaction start failed" });
      }

      // First, get user's role
      conn.query(
        "SELECT role FROM users WHERE id = ?",
        [userId],
        (err, roleResults) => {
          if (err || roleResults.length === 0) {
            return rollbackWithLog(
              "Error fetching user role",
              err || new Error("User not found")
            );
          }

          const role = roleResults[0].role;
          console.log("User role:", role);

          if (role === "teacher") {
            // Get all class IDs
            conn.query(
              "SELECT id FROM classes WHERE teacher_id = ?",
              [userId],
              (err, classResults) => {
                if (err) return rollbackWithLog("Error getting classes", err);

                const classIds = classResults.map((row) => row.id);
                console.log("Found class IDs:", classIds);

                if (classIds.length === 0) {
                  console.log(
                    "No classes found, proceeding to delete teacher user only"
                  );
                  return deleteAuthenticatorsAndUser();
                }

                const inClause = classIds.map(() => "?").join(",");

                // Step 1: Delete attendance_records
                conn.query(
                  `DELETE FROM attendance_records WHERE session_id IN (
                          SELECT id FROM attendance_sessions WHERE class_id IN (${inClause})
                       )`,
                  classIds,
                  (err) => {
                    if (err)
                      return rollbackWithLog(
                        "Error deleting attendance_records",
                        err
                      );

                    // Step 2: Delete attendance_sessions
                    conn.query(
                      `DELETE FROM attendance_sessions WHERE class_id IN (${inClause})`,
                      classIds,
                      (err) => {
                        if (err)
                          return rollbackWithLog(
                            "Error deleting attendance_sessions",
                            err
                          );

                        // Step 3: Delete class_students
                        conn.query(
                          `DELETE FROM class_students WHERE class_id IN (${inClause})`,
                          classIds,
                          (err) => {
                            if (err)
                              return rollbackWithLog(
                                "Error deleting class_students",
                                err
                              );

                            // Step 4: Delete classes
                            conn.query(
                              `DELETE FROM classes WHERE id IN (${inClause})`,
                              classIds,
                              (err) => {
                                if (err)
                                  return rollbackWithLog(
                                    "Error deleting classes",
                                    err
                                  );

                                return deleteAuthenticatorsAndUser(); // delete user
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
          } else {
            // Student: delete attendance + authenticators
            conn.query(
              "DELETE FROM attendance_records WHERE student_id = ?",
              [userId],
              (err) => {
                if (err)
                  return rollbackWithLog(
                    "Error deleting student's attendance records",
                    err
                  );

                return deleteAuthenticatorsAndUser();
              }
            );
          }

          function deleteAuthenticatorsAndUser() {
            conn.query(
              "DELETE FROM authenticators WHERE user_id = ?",
              [userId],
              (err) => {
                if (err)
                  return rollbackWithLog("Error deleting authenticators", err);

                conn.query(
                  "DELETE FROM users WHERE id = ?",
                  [userId],
                  (err, results) => {
                    if (err) return rollbackWithLog("Error deleting user", err);

                    if (results.affectedRows === 0) {
                      return rollbackWithLog(
                        "User not found",
                        new Error("No rows affected")
                      );
                    }

                    conn.commit((err) => {
                      if (err) return rollbackWithLog("Commit failed", err);

                      conn.release();
                      res.clearCookie("refreshToken", {
                        httpOnly: true,
                        secure: false,
                        sameSite: "Strict",
                      });

                      console.log(
                        "Successfully deleted user and all associated data for user ID:",
                        userId
                      );
                      return res.status(200).json({
                        message: "Account and all data deleted successfully",
                      });
                    });
                  }
                );
              }
            );
          }

          function rollbackWithLog(message, err) {
            console.error(message + ":", err);
            conn.rollback(() => {
              conn.release();
              console.error("Rollback complete");
              res.status(500).json({ message });
            });
          }
        }
      );
    });
  });
});

app.get("/GetUserInfo", verifyJWT, (req, res) => {
  const userId = req.user.id;

  const query = "SELECT * FROM users WHERE id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];

    return res.status(200).json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      email: user.email,
    });
  });
});

const bcrypt = require("bcrypt");

app.post("/handleChanges", verifyJWT, async (req, res) => {
  const { userData, password } = req.body;
  const userId = req.user.id;

  let query;
  let params;

  if (!password || password.trim() === "") {
    query = "UPDATE users SET email = ?, username = ? WHERE id = ?";
    params = [userData.email, userData.username, userId];
  } else {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = "UPDATE users SET email = ?, username = ?, password_hash = ? WHERE id = ?";
      params = [userData.email, userData.username, hashedPassword, userId];
    } catch (err) {
      console.error("Hashing error:", err);
      return res.status(500).json({ message: "Error hashing password" });
    }
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    return res.status(200).json({ message: "User updated successfully" });
  });
});


module.exports = app;
