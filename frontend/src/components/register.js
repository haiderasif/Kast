import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Don't include credentials unless you're using cookies
          // "Authorization": "Bearer token" // Only if needed
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg(data.message);
        setError("");
      } else {
        setError(data.error || "Registration failed");
        setMsg("");
      }
    } catch (err) {
      setError("Registration failed - server error");
      console.error("Registration error:", err);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10, p: 3, border: "1px solid #ccc", borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Register
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {msg && <Alert severity="success">{msg}</Alert>}
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleSubmit}
        >
          Register
        </Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate("/")}>
          Back to Login
        </Button>
      </Box>
    </Container>
  );
}

export default Register;
