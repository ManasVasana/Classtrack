  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();

    if (!attendanceCode?.trim())
      return alert("⚠️ Please enter the attendance code");
    if (!navigator.geolocation) return alert("📍 Geolocation not supported");

    setStatus(null);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      console.log("📍 Location:", lat, lng);

      try {
        const res = await api.post("/markAttendance", {
          class_id,
          attendance_code: attendanceCode,
          student_lat: lat,
          student_lng: lng,
        });

        const options = res.data.registrationOptions;
        console.log("📄 Registration options:", options);

        // If device not registered
        if (res.status === 206) {
          console.log("registeringvbgggggggggggggggg");
          console.log("Registration options:", options);

          const attResp = await startRegistration({ optionsJSON: options });
          console.log("📄 Attestation response:", attResp);
          await api.post("http://localhost:3001/verify-registration", attResp);

          alert("✅ Registered successfully. Authenticating...");

          const authOptsRes = await api.post(
            "/generate-authentication-options"
          );
          const authResp = await startAuthentication({
            optionsJSON: authOptsRes.data,
          });

          const final = await api.post("/markAttendance", {
            class_id,
            attendance_code: attendanceCode,
            student_lat: lat,
            student_lng: lng,
            auth_response: authResp,
          });

          setStatus({ success: true, message: final.data.message });
        } else if (status === 400) {
          console.log("authenticatinggggggggggggg");
          const authOptsRes = await api.post(
            "/generate-authentication-options"
          );
          const authResp = await startAuthentication({
            optionsJSON: authOptsRes.data,
          });

          const final = await api.post("/markAttendance", {
            class_id,
            attendance_code: attendanceCode,
            student_lat: lat,
            student_lng: lng,
            auth_response: authResp,
          });
          
          setStatus({ success: true, message: final.data.message });
        }
      } catch (err) {
        console.error("❌ Error:", err);
        const msg = err?.response?.data?.message || err.message;
        setStatus({ success: false, message: msg });
      }
    });
  };

app.post("/markAttendance", verifyJWT, async (req, res) => {
  const { class_id, attendance_code, student_lat, student_lng, auth_response } =
    req.body;
  const userId = req.user.id;
  const username = req.user.username;
  console.log("markattendace",req.body);

  console.log("🔐 Marking attendance for user:", username);
  console.log("📍 Student location:", student_lat, student_lng);

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Wrap db.query in a promise so we can await it
  const getUser = (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT id, username, credential_id, public_key, auth_counter FROM users WHERE id = ?",
        [userId],
        (err, result) => {
          if (err || result.length === 0) return reject("Student not found");
          resolve(result[0]);
        }
      );
    });
  };

  try {
    const student = await getUser(userId);

    // If no credential, return 206 and registrationOptions
    if (!student.credential_id || !student.public_key) {
      const options = await generateRegistrationOptions({
        rpName: "ClassTrack",
        rpID: "localhost",
        userID: Buffer.from(userId.toString()),
        userName: student.username,
        attestationType: "none",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "required",
          requireResidentKey: true,
        },
      });

      req.session.currentRegistrationChallenge = options.challenge;

      return res.status(206).json({ step: "register", registrationOptions: options });
    }

    // TODO: Continue with normal attendance flow...
  } catch (err) {
    console.error("❌ Error in markAttendance:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }

  db.query(
    "SELECT id, teacher_lat, teacher_lng FROM attendance_sessions WHERE class_id = ? AND attendance_code = ? AND is_active = 1",
    [class_id, attendance_code],
    async (err, sessionResult) => {
      if (err || sessionResult.length === 0) {
        return res.status(404).json({ message: "Invalid code/session" });
      }

      const session = sessionResult[0];
      const distance = haversine(
        session.teacher_lat,
        session.teacher_lng,
        student_lat,
        student_lng
      );

      if (distance > 1000000) {
        console.log("oye",distance);
        return res.status(403).json({ message: "Not within 200 meters" });
      }

      console.log("auth response:",auth_response);

      if (!auth_response) {
        return res.status(206).json({ step: "authenticate", message: "Missing WebAuthn response" });
      }

      try {
        const result = await verifyAuthenticationResponse({
          response: auth_response,
          expectedChallenge: req.session.challenge,
          expectedOrigin: "http://localhost:5173",
          expectedRPID: "localhost",
          authenticator: {
    credentialID: Buffer.from(credential_id, 'base64url'),         // ✅ base64url string
    credentialPublicKey: Buffer.from(public_key, 'base64'),        // ✅ base64 (not url)
            counter: student.auth_counter,
          },
        });

        if (!result.verified) {
          return res.status(403).json({ message: "WebAuthn failed" });
        }

        db.query("UPDATE users SET auth_counter = ? WHERE id = ?", [
          result.authenticationInfo.newCounter,
          userId,
        ]);

        // Check duplicate
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
                res.json({ message: "Attendance marked successfully" });
              }
            );
          }
        );
      } catch (e) {
        console.error("Auth verify error:", e);
        res.status(403).json({ message: "Authentication error" });
      }
    }
  );
});

// everything working except verify reg

app.post("/markAttendance", verifyJWT, async (req, res) => {
  const { class_id, attendance_code, student_lat, student_lng, auth_response } =
    req.body;
  const userId = req.user.id;
  const username = req.user.username;
  console.log("markattendace", req.body);

  console.log("🔐 Marking attendance for user:", username);
  console.log("📍 Student location:", student_lat, student_lng);

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Wrap db.query in a promise so we can await it
  const getUser = (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT id, username, credential_id, public_key, auth_counter FROM users WHERE id = ?",
        [userId],
        (err, result) => {
          if (err || result.length === 0) return reject("Student not found");
          resolve(result[0]);
        }
      );
    });
  };

  try {
    const student = await getUser(userId);

    console.log(student);

    // If no credential, return 206 and registrationOptions
    if (!student.credential_id || !student.public_key) {
      const options = await generateRegistrationOptions({
        rpName: "ClassTrack",
        rpID: "localhost",
        userID: Buffer.from(userId.toString()),
        userName: student.username,
        attestationType: "none",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "required",
          requireResidentKey: true,
        },
      });

      req.session.currentRegistrationChallenge = options.challenge;

      return res
        .status(206)
        .json({ step: "register", registrationOptions: options });
    }

    db.query(
      "SELECT id, teacher_lat, teacher_lng FROM attendance_sessions WHERE class_id = ? AND attendance_code = ? AND is_active = 1",
      [class_id, attendance_code],
      async (err, sessionResult) => {
        if (err || sessionResult.length === 0) {
          return res.status(404).json({ message: "Invalid code/session" });
        }

        const session = sessionResult[0];
        const distance = haversine(
          session.teacher_lat,
          session.teacher_lng,
          student_lat,
          student_lng
        );

        if (distance > 1000000) {
          console.log("oye", distance);
          return res.status(403).json({ message: "Not within 200 meters" });
        }

        console.log("auth response:", auth_response);

        if (!auth_response) {
          return res.status(206).json({
            step: "authenticate",
            message: "Missing WebAuthn response",
          });
        }

        try {
          const result = await verifyAuthenticationResponse({
            response: auth_response,
            expectedChallenge: req.session.challenge,
            expectedOrigin: "http://localhost:5173",
            expectedRPID: "localhost",
            authenticator: {
              credentialID: Buffer.from(student.credential_id, "base64url"), // ✅ FIXED
              credentialPublicKey: Buffer.from(student.public_key, "base64url"),
              counter: 0,
            },
          });

          console.log("result:", result);

          if (!result.verified) {
            return res.status(403).json({ message: "WebAuthn failed" });
          }

          // db.query("UPDATE users SET auth_counter = ? WHERE id = ?", [
          //   result.authenticationInfo.newCounter,
          //   userId,
          // ]);

          // Check duplicate
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
                  res.json({ message: "Attendance marked successfully" });
                }
              );
            }
          );
        } catch (e) {
          console.error("Auth verify error:", e);
          res.status(403).json({ message: "Authentication error" });
        }
      }
    );
  } catch (err) {
    console.error("❌ Error in markAttendance:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

