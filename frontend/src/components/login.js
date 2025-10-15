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

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        navigate("/home");
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.log("Error:", err);

      setError("Login failed");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 15, p: 3, width: "411px" }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontSize: "40px",
            color: "#74706B",
            textAlign: "center",
          }}
        >
          What have you
        </Typography>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: "bold",
            fontSize: "40px",
            color: "#74706B",
            textAlign: "center",
            lineHeight: "10px",
          }}
        >
          read
        </Typography>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontSize: "40px",
            color: "#74706B",
            textAlign: "center",
          }}
        >
          recently?
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px", // Change this to your desired radius
            },
          }}
        />
        {/* <TextField
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px", // Change this to your desired radius
            },
          }}
        /> */}
        <Button
          variant="contained"
          fullWidth
          sx={{
            mt: 2,
            background: "#FF890A",
            padding: "10px",
            borderRadius: "12px",
          }}
          onClick={handleSubmit}
        >
          Sign Up or Log Back In
        </Button>
        <Button
          fullWidth
          sx={{ mt: 1, color: "#FF890A" }}
          onClick={() => navigate("/register")}
        >
          Go to Register
        </Button>
        <Typography
          sx={{
            mt: 2,
            textAlign: "center",
            color: "#74706B",
            fontSize: "14px",
            fontWeight: 300,
          }}
        >
          By continuing, you are agreeing to Kast’s Terms of Use and Privacy
          Policy
        </Typography>
        <Typography
          sx={{
            mt: 2,
            textAlign: "center",
            color: "#74706B",
            fontSize: "15px",
            fontWeight: 700,
            lineHeight: "22px",
            marginTop: "50px",
          }}
        >
          Kast is for saving the best things you find online and see what your
          friends are saving. Learn more here.
        </Typography>
      </Box>
    </Container>
  );
}

export default Login;
