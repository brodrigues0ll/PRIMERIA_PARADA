import Header from "@/components/Header";
import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Link from "next/link";

import {
  collection,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { database } from "@/services/firebase";

const Index = () => {
  const [comandas, setComandas] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(database, "comandas"), (doc) => {
      const docs = [];
      doc.forEach((comanda) => {
        docs.push({ ...comanda.data(), id: comanda.id });
      });
      setComandas(docs);
    });
    return () => unsubscribe();
  }, []);

  // Função para redirecionar a página para a rota do respectivo ID

  return (
    <>
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
          <Link href={`/orders/${comanda.id}`} key={comanda.id}>
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
                {comanda.id}
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
