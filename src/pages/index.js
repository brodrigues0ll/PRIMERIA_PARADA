import PercentTable from "../components/PercentTable";
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
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [quantidade, setQuantidade] = useState(0);
  const [preco, setPreco] = useState(0);
  const [uniPrice, setUniPrice] = useState(10);
  const [isUniPriceVisible, setIsUniPriceVisible] = useState(false);
  const [isTableVisible, setIsTableVisible] = useState(false);

  function colorSelect() {
    if (isTableVisible === true) {
      return "green";
    }
    return "#1976d2";
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "96vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "2rem",
          maxWidth: "500px",
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
          loading="lazy"
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
            placeholder="0"
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
            placeholder="0,00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Box>

        <Button
          variant="contained"
          onClick={() => {
            setIsUniPriceVisible(true);
            setUniPrice(parseFloat(price) / parseFloat(quantity));
            setQuantidade(quantity);
            setPreco(price);
            setPrice("");
            setQuantity("");
          }}
          disableElevation
          sx={{
            fontSize: "1.3rem",
            fontWeight: "bold",
            boxShadow: "2px 2px 10px #7a7a7a",
          }}
        >
          Calcular
        </Button>

        {isUniPriceVisible && (
          <>
            {uniPrice ? (
              <>
                <Typography
                  variant="h5"
                  sx={{
                    marginTop: "2rem",
                    textAlign: "center",
                  }}
                >
                  {quantidade} unidades a R$ {preco}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    marginBottom: "2rem",
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

        {isUniPriceVisible && (
          <button
            onClick={() => {
              setIsTableVisible(!isTableVisible);
            }}
            style={{
              fontSize: "1.2rem",
              border: "none",
              borderRadius: "5px",
              height: "3.2rem",
              color: "white",
              fontFamily: "Roboto, sans-serif",
              margin: "1rem 0",
              fontWeight: "bold",
              boxShadow: "2px 2px 10px #7a7a7a",
              backgroundColor: colorSelect(),
              cursor: "pointer",
            }}
          >
            TABELA DE PORCENTAGEM
          </button>
        )}

        {isTableVisible && <PercentTable price={uniPrice} />}
      </Box>
    </Box>
  );
}
