import { useRouter } from "next/router";
import Header from "@/components/Header";
import { Box, Button, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
// import pedidos from "./menu.json";

import {
  collection,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { database } from "@/services/firebase";

const DetalhesComanda = () => {
  const [pedidos, setPedidos] = useState([]);

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(database, "comandas", id, "pedidos"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPedidos(data);
      }
    );

    return () => {
      unsubscribe();
    };
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
            fontFamily: "sans-serif",
            fontWeight: "bold",
          }}
        >
          {id}
        </Typography>

        {pedidos.map((pedido) => (
          <Box
            key={pedido.nome}
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
              padding: "1.1rem",
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={5}>
                <Typography
                  sx={{
                    paddingRight: "5px",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pedido.nome}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <button
                    style={{
                      backgroundColor: "#A01F1F",
                      borderRadius: "100%",
                      width: "3rem",
                      height: "3rem",
                      color: "white",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      marginRight: "1rem",
                    }}
                    onClick={async () => {
                      const docRef = doc(
                        database,
                        "comandas",
                        id,
                        "pedidos",
                        pedido.id
                      );
                      await updateDoc(docRef, {
                        quantidade: Number(pedido.quantidade) - 1,
                      });
                    }}
                  >
                    -
                  </button>

                  <Typography
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0",
                    }}
                  >
                    {pedido.quantidade}
                  </Typography>

                  <button
                    style={{
                      backgroundColor: "green",
                      borderRadius: "100%",
                      width: "3rem",
                      height: "3rem",
                      color: "white",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      marginLeft: "1rem",
                    }}
                    onClick={async () => {
                      const docRef = doc(
                        database,
                        "comandas",
                        id,
                        "pedidos",
                        pedido.id
                      );
                      await updateDoc(docRef, {
                        quantidade: Number(pedido.quantidade) + 1,
                      });
                    }}
                  >
                    +
                  </button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ))}

        <Box
          sx={{
            position: "fixed",
            bottom: "10px",
            right: "20px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              display: "flex",
              bgcolor: "#2a2a2a",
              borderRadius: "10px",
              color: "white",
              height: "1px",
              fontSize: "1.5rem",
              fontWeight: "bold",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.7rem 3rem",
              marginRight: "-2rem",
            }}
          >
            {`Total: R$ `}
            {pedidos
              .reduce(
                (acc, pedido) => acc + pedido.quantidade * pedido.preco,
                0
              )
              .toFixed(2)
              .replace(".", ",")}
          </Typography>

          <Button
            sx={{
              display: "flex",
              bgcolor: "#A01F1F",
              borderRadius: "100%",
              width: "80px",
              height: "80px",
              color: "white",
              fontSize: "3rem",
              fontWeight: "bold",
            }}
          >
            +
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          marginTop: "10rem",
        }}
      />
    </>
  );
};

export default DetalhesComanda;
