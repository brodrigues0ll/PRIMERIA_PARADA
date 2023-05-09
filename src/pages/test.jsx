import { Box, Typography } from "@mui/material";
import React from "react";

const test = () => {
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "3rem",
      }}
    >
      <Typography variant="h3">Página de Teste</Typography>
    </Box>
  );
};

export default test;
