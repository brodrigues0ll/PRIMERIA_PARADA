import { Box, Typography } from "@mui/material";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const ActiveLink = ({ href, children }) => {
  const router = useRouter();
  const [isActive, setIsActive] = useState(router.pathname === href);

  const handleClick = (e) => {
    e.preventDefault();
    router.push(href);
  };

  useEffect(() => {
    setIsActive(router.pathname === href);
  }, [router.pathname, href]);

  return (
    <Typography
      sx={{
        borderBottom: isActive ? "2px solid #fff" : "none",
      }}
      className={isActive ? "active" : ""}
      onClick={handleClick}
    >
      {children}
    </Typography>
  );
};

export default ActiveLink;
