import React, { useState } from "react";
import menu from "./menu";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
} from "@mui/material";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredMenu = Object.keys(menu).reduce((acc, categoria) => {
    const filteredItems = menu[categoria].filter((item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredItems.length > 0) {
      acc[categoria] = filteredItems;
    }
    return acc;
  }, {});

  return (
    <div>
      <h1 style={{ fontFamily: "sans-serif" }}>Cardápio</h1>
      <TextField
        label="Pesquisar"
        variant="outlined"
        value={searchTerm}
        onChange={handleSearchTermChange}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Categoria</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Preço</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(filteredMenu).map((categoria) => (
              <React.Fragment key={categoria}>
                <TableRow>
                  <TableCell colSpan={3} style={{ fontWeight: "bold" }}>
                    {categoria}
                  </TableCell>
                </TableRow>
                {filteredMenu[categoria].map((item) => (
                  <TableRow key={item.nome}>
                    <TableCell></TableCell>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell>{item.preco.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Index;
