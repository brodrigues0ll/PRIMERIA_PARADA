import React from "react";
import { InputAdornment, TextField } from "@mui/material";
import { NumericFormat } from "react-number-format";

const CurrencyTextField = ({ value, onChange, placeholder, sx, label }) => {
  return (
    <NumericFormat
      InputProps={{
        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
      }}
      id="outlined-basic"
      label={label}
      variant="outlined"
      onChange={onChange}
      customInput={TextField}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      value={value}
      required
      placeholder={placeholder}
      sx={sx}
      allowNegative={false}
      allowEmptyFormatting={true}
      allowLeadingZeros={true}
    />
  );
};

export default CurrencyTextField;
