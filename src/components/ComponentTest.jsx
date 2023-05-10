import { useState } from "react";
import { TextField, InputAdornment } from "@mui/material";

function MyTextField({ value, onChange, sx, variant, label }) {
  const [valor, setValor] = useState("");

  const formatCurrency = (rawValue) => {
    // remove os separadores existentes
    let value = rawValue.replaceAll(".", "").replace(",", "");

    // limita a quantidade de caracteres
    if (value.length > 15) {
      value = value.slice(0, 15);
    }

    // formata o valor como moeda brasileira
    let formattedValue = (+value / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (formattedValue === "NaN") {
      formattedValue = "";
    }

    setValor(formattedValue);

    onChange(formattedValue);
  };

  const handleChange = (event) => {
    const rawValue = event.target.value;

    // remove todos os caracteres que não são números, pontos ou vírgulas
    const filteredValue = rawValue.replace(/[^\d.,]/g, "");

    formatCurrency(filteredValue);
  };

  return (
    <TextField
      id="CurrencyTextMask"
      label={label}
      value={valor}
      onChange={handleChange}
      InputProps={{
        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
      }}
      sx={sx}
      variant={variant}
    />
  );
}

export default MyTextField;
