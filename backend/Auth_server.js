// // server.js
// const express = require("express");
// const cors = require("cors");
// const base64url = require("base64url");
// const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require("@simplewebauthn/server");
// const app = express();
// app.use(cors());
// app.use(express.json());

// const port = 3001;

// const db = {}; // Simulate a database. Use real DB in production.

// // Registration route
// app.post("/generate-registration-options", (req, res) => {
//   const { username } = req.body;

//   const options = generateRegistrationOptions({
//     rpName: "ClassTrack",
//     rpID: "localhost", // replace with your domain in production
//     userID: username,
//     userName: username,
//     attestationType: "none",
//     authenticatorSelection: {
//       userVerification: "preferred",
//     },
//   });

//   db[username] = { registrationOptions: options }; // save challenge
//   res.json(options);
// });

// // Registration response
// app.post("/verify-registration", async (req, res) => {
//   const { username, attestationResponse } = req.body;
//   const expectedChallenge = db[username]?.registrationOptions?.challenge;

//   const verification = await verifyRegistrationResponse({
//     response: attestationResponse,
//     expectedChallenge,
//     expectedOrigin: "http://localhost:3000", // your frontend
//     expectedRPID: "localhost",
//   });

//   if (verification.verified) {
//     db[username].authenticator = verification.registrationInfo;
//     res.json({ success: true });
//   } else {
//     res.status(403).json({ success: false });
//   }
// });

// // Generate challenge for login
// app.post("/generate-authentication-options", (req, res) => {
//   const { username } = req.body;
//   const user = db[username];

//   if (!user?.authenticator) return res.status(404).json({ error: "Not registered" });

//   const options = generateAuthenticationOptions({
//     allowCredentials: [{
//       id: user.authenticator.credentialID,
//       type: "public-key",
//     }],
//     userVerification: "preferred",
//   });

//   user.authenticationOptions = options;
//   res.json(options);
// });

// // Verify login
// app.post("/verify-authentication", async (req, res) => {
//   const { username, assertionResponse } = req.body;
//   const user = db[username];

//   const verification = await verifyAuthenticationResponse({
//     response: assertionResponse,
//     expectedChallenge: user.authenticationOptions.challenge,
//     expectedOrigin: "http://localhost:3000",
//     expectedRPID: "localhost",
//     authenticator: user.authenticator,
//   });

//   if (verification.verified) {
//     res.json({ success: true });
//   } else {
//     res.status(403).json({ success: false });
//   }
// });

// app.listen(port, () => console.log(`Listening on http://localhost:${port}`));


