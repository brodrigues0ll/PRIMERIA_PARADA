import Header from "@/components/Header";
import HomePages from "@/components/HomePages";
import { Box, Button } from "@mui/material";
import React from "react";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/router";
import { database } from "@/services/firebase";

const index = () => {
  const router = useRouter();

  function logOut() {
    const auth = getAuth();
    auth.signOut();
    router.push("/");
  }

  return (
    <>
      <Header />
      <Box
        sx={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "90vh",
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            bgcolor: "#0e0e0e",
            padding: "1rem 0.5rem",
            borderRadius: "2rem",
            justifyContent: "center",
          }}
        >
          {/* <HomePages
            src="/assets/icons/calculator.svg"
            alt="calculator"
            title="Calculadora de Taxas"
            route="taxes"
          />

          <HomePages
            src="/assets/icons/percent.svg"
            alt="percent"
            title="Calculadora de Ganhos"
            route="percent-calculator"
          />

          <HomePages
            src="/assets/icons/cash-register.svg"
            alt="cash-register"
            title="Caixa"
            route="cash-register"
          />

          <HomePages
            src="/assets/icons/inventory.svg"
            alt="inventory"
            title="Estoque"
            route="inventory"
          />

          <HomePages
            src="/assets/icons/suppliers.svg"
            alt="suppliers"
            title="Fornecedores"
            route="suppliers"
          />

          <HomePages
            src="/assets/icons/user.svg"
            alt="clients"
            title="Clientes"
            route="clients"
          /> */}

          <HomePages
            src="/assets/icons/menu.svg"
            alt="menu"
            title="Cardápio"
            route="price-table"
          />

          <HomePages
            src="/assets/icons/order.svg"
            alt="order"
            title="Comandas"
            route="orders"
          />
        </Box>
        <Button onClick={logOut}>LOGOUT</Button>
      </Box>
    </>
  );
};

export default index;
