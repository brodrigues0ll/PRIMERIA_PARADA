import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

const Header = () => {
  return (
    <Box
      sx={{
        bgcolor: "#101010",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        height: {
          xs: "48px",
          sm: "48px",
          md: "60px",
          lg: "60px",
          xl: "70px",
        },
      }}
    >
      <Image
        src="/assets/images/LOGO-2.png"
        alt="Logo"
        width={45}
        height={45}
      />
      <Typography
        sx={{
          fontFamily: "MilkyMatcha",
          color: "#fff",
        }}
      >
        Primeira Parada
      </Typography>

      <Button>
        <Image
          src="/assets/icons/hamburgerMenu.svg"
          alt="Menu"
          width={30}
          height={30}
        />
      </Button>
    </Box>
  );
};

export default Header;
