import { Box, Typography } from "@mui/material";
import Link from "next/link";
import React from "react";

const Navbar = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
        bgcolor: "#e1e1e1",
        position: "absolute",
        top: 0,
        left: 0,
        padding: "0 16px",
        width: "95%",
        height: "64px",
      }}
    >
      <Link
        href="/"
        style={{
          textDecoration: "none",
          color: "black",
        }}
      >
        <Typography variant="h5">Porcentagem</Typography>
      </Link>

      <Typography variant="h5">|</Typography>

      <Link
        href="/price-table"
        style={{
          textDecoration: "none",
          color: "black",
        }}
      >
        <Typography variant="h5">Cardápio</Typography>
      </Link>
    </Box>
  );
};

export default Navbar;
