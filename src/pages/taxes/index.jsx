import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const index = () => {
  return (
    <>
      <Box
        sx={{
          color: "white",
          fontFamily: "Sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Link href="/">
            <Button>
              <Image src="/assets/icons/backward.svg" width={40} height={40} />
            </Button>
          </Link>

          <Typography
            variant="h5"
            sx={{
              fontSize: "1.3rem",
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            Calculadora de Taxas
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            variant="outlined"
            sx={{
              borderRadius: "3rem",
              color: "white",
              border: "1px solid red",
              margin: "0 0.5rem",
              marginTop: "3rem",
              "&:hover": {
                background: "red",
                border: "1px solid red",
              },
            }}
          >
            Quero Cobrar
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderRadius: "3rem",
              color: "white",
              border: "1px solid red",
              margin: "0 0.5rem",
              marginTop: "3rem",
              "&:hover": {
                background: "red",
                border: "1px solid red",
              },
            }}
          >
            Quero Receber
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default index;
