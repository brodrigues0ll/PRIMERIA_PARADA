import Header from "@/components/Header";
import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import AddOrderModal from "@/components/AddOrderModal";

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(database, "comandas"), (doc) => {
      const docs = [];
      doc.forEach((comanda) => {
        docs.push({ ...comanda.data(), id: comanda.id });
      });
      const comadasAbertas = docs.filter(
        (comanda) => comanda.status === "aberta"
      );
      setComandas(comadasAbertas);
    });
    return () => unsubscribe();
  }, []);

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
          <Link
            style={{ textDecoration: "none" }}
            href={`/orders/${comanda.id}`}
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

              <Box></Box>
            </Button>
          </Link>
        ))}

        <Button
          sx={{
            display: "flex",
            bgcolor: "#A01F1F",
            borderRadius: "100%",
            position: "fixed",
            bottom: "50px",
            right: "20px",
            width: "80px",
            height: "80px",
            color: "white",
            fontSize: "3rem",
            fontWeight: "bold",
          }}
          onClick={() => setOpen(true)}
        >
          +
        </Button>
      </Box>

      <AddOrderModal
        props={{
          open,
          handleClose: () => setOpen(false),
        }}
      />
    </>
  );
};

export default Index;
