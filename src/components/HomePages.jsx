import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const HomePages = ({ src, alt, title, route }) => {
  return (
    <Link style={{ textDecoration: "none" }} href={`/${route}`}>
      <Button
        sx={{
          width: "100px",
          height: "100px",
          display: "flex",
          flexDirection: "column",
          flexWrap: "wrap",
          textAlign: "start",
          alignItems: "start",
          bgcolor: "#2a2a2a",
          margin: "5px",
          borderRadius: "10px",
        }}
      >
        <Image
          style={{
            marginBottom: "0.5rem",
          }}
          src={src}
          alt={alt}
          width={40}
          height={40}
        />
        <Typography
          sx={{
            fontFamily: "Itim",
            color: "#fff",
            fontSize: "11px",
          }}
        >
          {title}
        </Typography>
      </Button>
    </Link>
  );
};

export default HomePages;
