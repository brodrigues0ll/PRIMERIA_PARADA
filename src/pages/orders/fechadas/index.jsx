import Header from "@/components/Header";
import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import AddOrderModal from "@/components/AddOrderModal";

import { collection, onSnapshot } from "firebase/firestore";
import { database } from "@/services/firebase";
import Head from "next/head";

const Index = () => {
  const [comandas, setComandas] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(database, "comandas"), (doc) => {
      const docs = [];
      doc.forEach((comanda) => {
        docs.push({ ...comanda.data(), id: comanda.id });
      });
      const comandasFechadas = docs.filter(
        (comanda) => comanda.status === "Fechada"
      );
      setComandas(comandasFechadas);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <Head>
        <title>Primeira Parada</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Box>
        <Typography
          variant="h5"
          sx={{
            display: "flex",
            justifyContent: "center",
            color: "white",
            bgcolor: "#101010",
            padding: "10px",
            fontFamily: "MilkyMatcha",
          }}
        >
          Comandas
        </Typography>

        {comandas.map((comanda) => (
          <Link
            style={{ textDecoration: "none" }}
            href={`/orders/fechadas/${comanda.id}`}
            key={comanda.id}
          >
            <Button
              sx={{
                width: "90%",
                display: "flex",
                flexDirection: "column",
                flexWrap: "wrap",
                textAlign: "start",
                alignItems: "start",
                bgcolor: "#2a2a2a",
                borderRadius: "10px",
                color: "white",
                margin: "1rem auto",
                padding: "1.5rem",
              }}
            >
              <Typography
                sx={{
                  paddingRight: "5px",
                }}
              >
                {comanda.nome}
              </Typography>
              <Typography
                sx={{
                  paddingRight: "5px",
                }}
              >
                {comanda.fechadaEm}
              </Typography>

              <Box></Box>
            </Button>
          </Link>
        ))}
      </Box>
    </>
  );
};

export default Index;
