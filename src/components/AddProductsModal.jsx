import React, { useEffect, useState } from "react";
import {
  Button,
  TextField,
  Modal,
  Backdrop,
  Fade,
  Typography,
  Box,
} from "@mui/material";

import {
  collection,
  updateDoc,
  getDoc,
  setDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { database } from "@/services/firebase";
import { useRouter } from "next/router";

const AddProductsModal = ({ props }) => {
  const [produtos, setProdutos] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(database, "cardapio"), (doc) => {
      const docs = [];
      doc.forEach((item) => {
        docs.push({ ...item.data(), id: item.id });
      });
      setProdutos(docs);
    });
    return () => unsubscribe();
  }, []);

  async function handleAddProduct(pedidoID) {
    try {
      const pedidoRef = doc(database, "comandas", id, "pedidos", pedidoID);
      const pedidoDoc = await getDoc(pedidoRef);

      if (pedidoDoc.exists()) {
        // O pedido já existe, você pode atualizar os campos necessários aqui
        // Por exemplo, incrementar a quantidade em 1
        const quantidade = pedidoDoc.data().quantidade || 0;
        await updateDoc(pedidoRef, { quantidade: Number(quantidade) + 1 });
        setSelectedProduct(null); // Limpar o estado apenas se o pedido existir
      } else {
        // O pedido não existe, crie um novo documento com os campos iniciais
        await setDoc(pedidoRef, {
          nome: selectedProduct.nome,
          preco: `${selectedProduct.preco}`,
          quantidade: "1",
        });
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
    }
  }

  const handleClickAddProduct = async (item) => {
    try {
      const pedidoRef = doc(database, "comandas", id, "pedidos", item.id);
      const pedidoDoc = await getDoc(pedidoRef);

      if (pedidoDoc.exists()) {
        const quantidade = pedidoDoc.data().quantidade || 0;
        await updateDoc(pedidoRef, { quantidade: Number(quantidade) + 1 });
      } else {
        await setDoc(pedidoRef, {
          nome: item.nome,
          preco: `${item.preco}`,
          quantidade: "1",
        });
      }

      setSelectedProduct(null);
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
    }
  };

  const filteredProdutos = produtos.filter((item) => {
    return item.nome.toLowerCase().includes(searchValue.toLowerCase());
  });

  const handleCloseModal = () => {
    setSearchValue("");
    props.handleClose();
  };

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={props.open}
      onClose={handleCloseModal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={props.open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: "80vw",
            height: "60vh",
            backgroundColor: "#2a2a2a",
            borderRadius: "10px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TextField
            label="Produto"
            variant="outlined"
            sx={{
              margin: "0 auto",
              marginBottom: "1rem",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#fff",
                  borderWidth: "2px",
                },
              },
              "& .MuiOutlinedInput-root:hover": {
                "& fieldset": {
                  borderColor: "red",
                },
              },
              "& .MuiOutlinedInput-root.Mui-focused": {
                "& fieldset": {
                  borderColor: "red",
                },
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "red",
              },
              "& .MuiOutlinedInput-input": {
                color: "#fff",
              },
              "& .MuiOutlinedInput-input:hover": {
                color: "#fff",
              },
              "& .MuiInputLabel-outlined": {
                color: "white",
              },
              "& .MuiInputLabel-outlined.Mui-focused": {
                color: "white",
              },
            }}
            onChange={(e) => setSearchValue(e.target.value)}
          />

          <Box
            sx={{
              width: "100%",
              height: "100%",
              overflowY: "scroll",
            }}
          >
            {filteredProdutos
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((item) => {
                return (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      marginBottom: "1rem",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#fff",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                      }}
                    >
                      {item.nome}
                    </Typography>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleClickAddProduct(item)}
                    >
                      ADD
                    </Button>
                  </Box>
                );
              })}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AddProductsModal;
