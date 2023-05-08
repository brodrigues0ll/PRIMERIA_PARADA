import { Box, TextField } from "@mui/material";
import * as React from "react";

export default function LoginInput({
  id,
  label,
  variant,
  rows,
  value,
  onChange,
  type,
}) {
  return (
    <TextField
      id={id}
      label={label}
      variant={variant}
      multiline={id === "mensagem" ? true : false}
      rows={rows ? rows : 1}
      value={value}
      onChange={onChange}
      type={type ? type : "text"}
      sx={{
        margin: "0 auto",
        marginBottom: "1rem",
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "#fff",
            borderWidth: "2px",
          },
        },

        "& .MuiOutlinedInput-root:hover": {
          "& fieldset": {
            borderColor: "red",
          },
        },

        "& .MuiOutlinedInput-root.Mui-focused": {
          "& fieldset": {
            borderColor: "red",
          },
        },

        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "red",
        },

        "& .MuiOutlinedInput-input": {
          color: "#fff",
        },
        "& .MuiOutlinedInput-input:hover": {
          color: "#fff",
        },

        "& .MuiInputLabel-outlined": {
          color: "white",
        },
        "& .MuiInputLabel-outlined.Mui-focused": {
          color: "white",
        },
      }}
    />
  );
}
