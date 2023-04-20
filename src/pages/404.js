import Header from "@/components/Header";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import React from "react";

const page404 = () => {
  return (
    <>
      <Header />
      <Box
        sx={{
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "90vh",
        }}
      >
        <Typography variant="h3">Erro 404</Typography>
        <Typography variant="body2">
          A página ainda não foi desenvolvida
        </Typography>
        <Link href="/">
          <Button variant="contained">
            <Typography variant="h6">Voltar</Typography>
          </Button>
        </Link>
      </Box>
    </>
  );
};

export default page404;
