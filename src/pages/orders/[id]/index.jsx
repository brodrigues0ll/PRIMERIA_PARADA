import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Box, Button, Grid, Typography } from "@mui/material";
import { useRouter } from "next/router";
import AddProductsModal from "@/components/AddProductsModal";

import {
  collection,
  updateDoc,
  deleteDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { database } from "@/services/firebase";

const OrderDetails = () => {
  const [pedidos, setPedidos] = useState([]);
  const [open, setOpen] = useState(false);
  const [cliente, setCliente] = useState([]);

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(database, "comandas", id, "pedidos"),
      (snapshot) =>
        setPedidos(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })))
    );

    const unsubscribeClienteId = onSnapshot(
      doc(database, "comandas", id),
      (snapshot) => setCliente(snapshot.data())
    );

    return () => {
      unsubscribe();
      unsubscribeClienteId();
    };
  }, []);

  async function handleIncrement(pedidoId) {
    const pedidoRef = doc(database, "comandas", id, "pedidos", pedidoId);

    const currentPedido = pedidos.find((pedido) => pedido.id === pedidoId);

    const updatedQuantity = Number(currentPedido.quantidade) + 1;

    await updateDoc(pedidoRef, { quantidade: updatedQuantity });
  }

  async function handleDecrement(pedidoId) {
    const pedidoRef = doc(database, "comandas", id, "pedidos", pedidoId);

    const currentPedido = pedidos.find((pedido) => pedido.id === pedidoId);

    const updatedQuantity = Number(currentPedido.quantidade) - 1;

    if (updatedQuantity === 0) {
      await deleteDoc(pedidoRef);
    } else {
      await updateDoc(pedidoRef, { quantidade: updatedQuantity });
    }
  }

  const handleSetStatus = () => {
    try {
      const pedidoRef = doc(database, "comandas", id);
      updateDoc(pedidoRef, {
        status: "Fechada",
        fechadaEm:
          new Date().toLocaleDateString() +
          ", " +
          new Date().toLocaleTimeString(),
      });
      router.push("/orders");
    } catch (error) {
      console.log(error);
    }
  };

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
          {cliente.nome}
        </Typography>

        {pedidos.map((pedido) => (
          <Box
            key={pedido.id}
            sx={{
              width: "90%",
              display: "flex",
              flexDirection: "column",
              flexWrap: "wrap",
              bgcolor: "#2a2a2a",
              borderRadius: "10px",
              color: "white",
              margin: "1rem auto",
              padding: "1.5rem",
            }}
          >
            <Grid container spacing={2}>
              <Grid
                item
                xs={5}
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography>{pedido.nome}</Typography>
                  <Typography sx={{ fontWeight: "bold" }}>
                    {`R$ ${pedido.preco}`}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={7}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                  }}
                >
                  <Button
                    variant="contained"
                    color="error"
                    sx={{
                      borderRadius: "999px",
                      height: "64px",
                    }}
                    onClick={() => handleDecrement(pedido.id)}
                  >
                    <Typography variant="h4">-</Typography>
                  </Button>

                  <Typography
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {pedido.quantidade}
                  </Typography>

                  <Button
                    variant="contained"
                    color="success"
                    sx={{
                      borderRadius: "999px",
                      height: "64px",
                    }}
                    onClick={() => handleIncrement(pedido.id)}
                  >
                    <Typography variant="h4">+</Typography>
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ))}

        {/* Total e ADD Button */}

        <Box
          sx={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              color: "white",
              fontSize: "1.8rem",
              fontWeight: "bold",
              bgcolor: "#1f1f1f",
              padding: "0.3rem 1.7rem",
              marginRight: "-0.7rem",
            }}
          >
            {`Total: R$`}
            {pedidos
              .reduce((acc, item) => {
                return acc + item.preco.replace(",", ".") * item.quantidade;
              }, 0)
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
            onClick={() => setOpen(true)}
          >
            +
          </Button>

          <Button
            sx={{
              display: "flex",
              bgcolor: "#2e7d32",
              borderRadius: "100%",
              width: "60px",
              height: "60px",
              color: "white",
              fontSize: "3rem",
              fontWeight: "bold",
              margin: "-15rem -0.4rem -6rem -2rem",
            }}
            onClick={() => handleSetStatus()}
          >
            ✔
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          marginTop: "10rem",
        }}
      />

      <AddProductsModal
        props={{
          open,
          setOpen,
          id,
          handleClose: () => setOpen(false),
        }}
      />
    </>
  );
};

export default OrderDetails;
