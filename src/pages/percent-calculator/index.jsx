import dynamic from "next/dynamic";
import CurrencyTextField from "../../components/CurrencyTextField";
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

  const PercentTable = dynamic(() => import("../../components/PercentTable"), {
    ssr: false,
  });

  function colorSelect() {
    if (isTableVisible === true) {
      return "#808080";
    }
    return "red";
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "96vh",
        bgcolor: "#181818",
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
          width={300}
          height={300}
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
              "& label.Mui-focused": {
                color: "white",
              },
              "& label": {
                color: "white",
              },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "red",
                },

                "&:hover fieldset": {
                  borderColor: "silver",
                },
              },

              "& .MuiInputBase-input": {
                color: "white",
              },

              ".MuiTypography-root": {
                color: "white",
              },
            }}
          />

          <CurrencyTextField
            placeholder="0,00"
            label="Preço Pago"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            sx={{
              width: "40%",
              "& label.Mui-focused": {
                color: "white",
              },
              "& label": {
                color: "white",
              },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "red",
                },

                "&:hover fieldset": {
                  borderColor: "silver",
                },
              },

              "& .MuiInputBase-input": {
                color: "white",
              },

              ".MuiTypography-root": {
                color: "white",
              },
            }}
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
            bgcolor: "red",
            border: "2px solid black",
            boxShadow: "none",

            "&:hover": {
              bgcolor: "#8c0000",
            },
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
              border: "2px solid black",
              boxShadow: "none",
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
