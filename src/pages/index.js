import { InputAdornment, TextField, Typography } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [quantity, setQuantity] = useState(10.95);
  const [price, setPrice] = useState(30.82);
  return (
    <>
      <Typography variant="h3">Price Calculator - Primeira Parada</Typography>

      <Typography variant="h4"> Hello World!! </Typography>

      <TextField
        value={quantity}
        type="number"
        id="outlined-basic"
        label="Quantidade"
        variant="outlined"
        InputProps={{
          startAdornment: <InputAdornment position="start">UN</InputAdornment>,
        }}
        sx={{
          width: "30%",
        }}
      />

      <TextField
        value={price}
        type="number"
        id="outlined-basic"
        label="Preço Total"
        variant="outlined"
        InputProps={{
          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
        }}
        sx={{
          width: "30%",
        }}
      />
    </>
  );
}
