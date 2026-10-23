const express = require("express");
const cors = require("cors");

require("dotenv").config();

// Load routes only after dotenv so their configuration is available at import time.
const authRoutes = require("./routes/auth");
const linkRoutes = require("./routes/links");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);

const PORT = process.env.PORT || 5001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

module.exports = app;
