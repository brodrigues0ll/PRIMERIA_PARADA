import {
  Box,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableBody,
  Typography,
} from "@mui/material";
import React from "react";

const PercentTable = ({ price }) => {
  function createData(percent, newPrice) {
    return { percent, newPrice };
  }

  const rows = [
    createData("100%", price + (100 / 100) * price),
    createData("95%", price + (95 / 100) * price),
    createData("90%", price + (90 / 100) * price),
    createData("85%", price + (85 / 100) * price),
    createData("80%", price + (80 / 100) * price),
    createData("75%", price + (75 / 100) * price),
    createData("70%", price + (70 / 100) * price),
    createData("65%", price + (65 / 100) * price),
    createData("60%", price + (60 / 100) * price),
    createData("55%", price + (55 / 100) * price),
    createData("50%", price + (50 / 100) * price),
    createData("45%", price + (45 / 100) * price),
    createData("40%", price + (40 / 100) * price),
    createData("35%", price + (35 / 100) * price),
    createData("30%", price + (30 / 100) * price),
    createData("25%", price + (25 / 100) * price),
    createData("20%", price + (20 / 100) * price),
    createData("15%", price + (15 / 100) * price),
    createData("10%", price + (10 / 100) * price),
    createData("5%", price + (5 / 100) * price),
  ];

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Porcentagem (%)</TableCell>
              <TableCell align="right">Preço a Cobrar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.name}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.percent}
                </TableCell>

                <TableCell align="right">
                  <Typography variant="h6">
                    R$ {row.newPrice.toFixed(2)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PercentTable;
