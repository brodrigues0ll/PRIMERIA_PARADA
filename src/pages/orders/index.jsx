import Header from "@/components/Header";
import { useRouter } from "next/router";
import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import AddOrderModal from "@/components/AddOrderModal";

import { collection, onSnapshot } from "firebase/firestore";
import { database } from "@/services/firebase";
import Head from "next/head";
import ActiveLink from "@/components/ActiveLink";

import backwardArrow from "../../../public/assets/icons/backward.svg";
import Image from "next/image";

const Index = () => {
  const [comandas, setComandas] = useState([]);
  const [open, setOpen] = useState(false);

  const router = useRouter();

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
      <Head>
        <title>Primeira Parada</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            color: "white",
            bgcolor: "#101010",
            padding: "10px",
            fontFamily: "MilkyMatcha",
            position: "relative",
          }}
        >
          <Button
            style={{
              position: "absolute",
              left: "10px",
              top: "0",
              height: "50px",
            }}
            onClick={() => router.push("/home")}
          >
            <Image src={backwardArrow} alt="Voltar" width={50} />
          </Button>
          <Typography
            variant="h5"
            sx={{
              fontFamily: "MilkyMatcha",
            }}
          >
            Comandas
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            color: "white",
            bgcolor: "#101010",
            padding: "10px",
          }}
        >
          <ActiveLink href="/orders">Abertas</ActiveLink>
          <ActiveLink href="/orders/fechadas">Fechadas</ActiveLink>
        </Box>

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
