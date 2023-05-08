import { Box, Button, Checkbox, TextField, Typography } from "@mui/material";
import React, { use, useEffect, useState } from "react";
import LoginInput from "@/components/LoginInput";
import { database } from "@/services/firebase";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/router";
const index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "80vw",
          boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.75)",
          padding: "3rem 3rem",
          gap: "3rem",
          margin: "0 auto",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#fff",
            textAlign: "center",
            fontFamily: "MilkyMatcha",
          }}
        >
          Login
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "3rem",
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

          <Box>
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
            <Box
              sx={{
                display: "flex",
                color: "white",
                alignItems: "center",
              }}
            >
              <Checkbox
                onChange={() => setPassVisible(!passVisible)}
                checked={passVisible}
                sx={{
                  color: "#fff",
                  // bgcolor: "#fff",
                  width: "30px",
                  height: "30px",
                  borderRadius: "0px",
                }}
              />
              <Typography>Mostrar Senha</Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            onClick={auth}
            variant="outlined"
            sx={{
              fontFamily: "MilkyMatcha",
              color: "#fff",
              borderColor: "red",
              borderWidth: "2px",
              height: "100%",
              width: "80%",
              boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.75)",
              ":hover": {
                borderColor: "#fff",
                borderWidth: "2px",
              },
            }}
          >
            Entrar
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default index;
