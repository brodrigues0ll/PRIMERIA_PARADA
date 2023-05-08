import { Box, Button, TextField, Typography } from "@mui/material";
import React, { use, useEffect, useState } from "react";
import LoginInput from "@/components/LoginInput";
import { database } from "@/services/firebase";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/router";
const index = () => {
  const [email, setEmail] = useState("usertest1@pp.com");
  const [password, setPassword] = useState("usertest1**");
  const [passVisible, setPassVisible] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();

    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log(user);
        router.push("/home");
      } else {
        console.log("Usuário não logado");
      }
    });
  }, []);

  function auth() {
    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        localStorage.setItem("user", JSON.stringify(user));
        router.push("/home");
        console.log(user);
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(error);
      });
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
      }}
    >
      <Box
        sx={{
          width: "84vw",
          height: "50vh",
          boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.75)",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#fff",
            textAlign: "center",
          }}
        >
          Login
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <LoginInput
            id="email"
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />

          <LoginInput
            id="senha"
            label="Senha"
            type={passVisible ? "text" : "password"}
            variant="outlined"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button onClick={auth} variant="outlined">
            Entrar
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default index;
