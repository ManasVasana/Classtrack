// middleware/verifyJWT.js
const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1]; // Expecting: "Bearer <token>"

  jwt.verify(token, process.env.JWT_secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Store decoded info for use in the route
    req.user = decoded;
    console.log("🔑 JWT verified:", req.user);
    next();
  });
};

module.exports = verifyJWT;
