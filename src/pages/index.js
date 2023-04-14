import CurrencyTextField from "../components/CurrencyTextField";
import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [quantity, setQuantity] = useState();
  const [price, setPrice] = useState();
  const [uniPrice, setUniPrice] = useState(10);
  const [uniPriceIsVisible, setUniPriceIsVisible] = useState(false);
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "",
          justifyContent: "center",
          height: "calc(100vh - 80px)",
          padding: "2rem",
        }}
      >
        <Image
          src="/assets/images/LOGO-2.png"
          alt="Logo"
          width={200}
          height={200}
          style={{
            margin: "1rem auto",
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
            margin: "1rem 0",
          }}
        >
          <TextField
            required
            value={quantity}
            id="outlined-basic"
            label="Quantidade"
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">UN</InputAdornment>
              ),
            }}
            onChange={(e) => setQuantity(e.target.value)}
            sx={{
              width: "40%",
            }}
          />

          <CurrencyTextField
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Box>

        <Button
          variant="contained"
          onClick={() => {
            setUniPriceIsVisible(true);
            setUniPrice(parseFloat(price) / parseFloat(quantity));
          }}
          sx={{
            fontSize: "1.3rem",
            fontWeight: "bold",
            boxShadow: "2px 2px 10px #7a7a7a",
          }}
        >
          Calcular
        </Button>

        {uniPriceIsVisible && (
          <>
            {uniPrice ? (
              <>
                <Typography
                  variant="h5"
                  sx={{
                    margin: "2rem 0",
                    textAlign: "center",
                  }}
                >
                  O valor pago na unidade do produto foi:
                </Typography>
                <Typography variant="h4" sx={{ textAlign: "center" }}>
                  R$ {uniPrice.toFixed(2)}
                </Typography>
              </>
            ) : (
              <Typography
                variant="h4"
                sx={{ textAlign: "center", color: "red" }}
              >
                Preencha os Campos Corretamente!!
              </Typography>
            )}
          </>
        )}
      </Box>
    </>
  );
}
