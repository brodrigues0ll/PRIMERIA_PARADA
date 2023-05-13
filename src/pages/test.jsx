import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import MyTextField from "@/components/ComponentTest";

const test = () => {
  const [currencyTextField, setCurrencyTextField] = useState("");
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

      <MyTextField
        value={currencyTextField}
        onChange={(value) => {
          setCurrencyTextField(value);
        }}
      />
    </Box>
  );
};

export default test;