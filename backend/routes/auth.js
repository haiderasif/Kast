const express = require("express");
const router = express.Router();
const admin = require("../firebase/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

console.log("JWT_SECRET:", JWT_SECRET);

// REGISTER
router.post("/register", async (req, res) => {
  console.log("Registering user:", req.body);

  const { email, password } = req.body;

  console.log("Registering user:", email);

  try {
    const user = await admin.auth().createUser({
      email,
      password,
    });

    const link = await admin.auth().generateEmailVerificationLink(email);
    console.log("Verification link:", link);

    res.status(200).json({ message: "User created. Verification email sent." });
  } catch (err) {
    console.log("Error creating user:", err);

    res.status(400).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().getUserByEmail(email);

    const user = await admin.auth().getUser(userRecord.uid);
    console.log("User record:", user);

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    const token = jwt.sign({ uid: user.uid, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (err) {
    console.log("Error creating user:", err);
    res.status(400).json({ error: "Invalid email or password" });
  }
});

// PROTECTED
router.get("/protected", verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, you are authenticated.` });
});

// Token verification middleware
function verifyToken(req, res, next) {
  const bearer = req.headers.authorization;
  if (!bearer) return res.status(401).json({ error: "No token provided" });

  const token = bearer.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

module.exports = router;
