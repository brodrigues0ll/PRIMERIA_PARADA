import Header from "@/components/Header";
import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import AddOrderModal from "@/components/AddOrderModal";

import { collection, onSnapshot } from "firebase/firestore";
import { database } from "@/services/firebase";
import Head from "next/head";
import ActiveLink from "@/components/ActiveLink";
import { useRouter } from "next/router";
import backwardArrow from "../../../../public/assets/icons/backward.svg";
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

      const comandasFechadas = docs.filter(
        (comanda) => comanda.status === "Fechada"
      );

      // Função para analisar a data e hora no formato "DD/MM/AAAA, HH:mm:ss"
      const parseDate = (dateString) => {
        const [datePart, timePart] = dateString.split(", ");
        const [day, month, year] = datePart.split("/");
        const [hour, minute, second] = timePart.split(":");
        return new Date(year, month - 1, day, hour, minute, second);
      };

      // Ordena as comandas com base na data e hora da chave "abertaEm"
      comandasFechadas.sort((b, a) => {
        const dateA = parseDate(a.abertaEm);
        const dateB = parseDate(b.abertaEm);
        return dateA - dateB;
      });

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
                {comanda.abertaEm}
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
