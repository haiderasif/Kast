const express = require("express");
const router = express.Router();
const admin = require("../firebase/admin");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET;
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required. See backend/.env.example.");
}

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

    res.status(200).json({
      message:
        "User created. Development verification link was written to the backend console.",
    });
  } catch (err) {
    console.log("Error creating user:", err);

    res.status(400).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!FIREBASE_WEB_API_KEY) {
      throw new Error("FIREBASE_WEB_API_KEY is required. See backend/.env.example.");
    }

    // Firebase Admin can look users up but cannot verify a password. The
    // Identity Toolkit REST endpoint performs the actual email/password sign-in.
    const signInResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    if (!signInResponse.ok) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const firebaseUser = await signInResponse.json();

    const user = await admin.auth().getUser(firebaseUser.localId);

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    const token = jwt.sign({ uid: user.uid, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (err) {
    console.log("Login error:", err.message);
    res.status(400).json({ error: "Invalid email or password" });
  }
});

// PROTECTED
router.get("/protected", verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, you are authenticated.` });
});

// Token verification middleware
module.exports = router;
