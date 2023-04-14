import React from "react";
import { InputAdornment, TextField } from "@mui/material";
import { NumericFormat } from "react-number-format";

const CurrencyTextField = ({ value, onChange }) => {
  return (
    <NumericFormat
      InputProps={{
        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
      }}
      id="outlined-basic"
      label="Preço Pago"
      variant="outlined"
      onChange={onChange}
      customInput={TextField}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowLeadingZeros
      value={value}
      required
      sx={{
        width: "40%",
      }}
    />
  );
};

export default CurrencyTextField;
