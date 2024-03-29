import Header from "@/components/Header";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  collection,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  doc,
  disableNetwork,
} from "firebase/firestore";
import { database } from "@/services/firebase";
import UpdateModal from "@/components/UpdateModal";
import AddModal from "@/components/AddModal";
import backwardArrow from "../../../public/assets/icons/backward.svg";
import Image from "next/image";
import { useRouter } from "next/router";

const index = () => {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const [modalType, setModalType] = useState("");
  const [cardapio, setCardapio] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const router = useRouter();

  const handleAdd = async () => {
    try {
      const docRef = await addDoc(collection(database, "cardapio"), {
        nome: name,
        preco: price,
        codigo: barcode,
      });
      setOpen(false);
      setBarcode("");
      setName("");
      setPrice("");
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdate = async () => {
    try {
      const docRef = doc(database, "cardapio", id);
      await updateDoc(docRef, {
        nome: name,
        preco: price,
        codigo: barcode,
      });
      setOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async () => {
    try {
      const docRef = doc(database, "cardapio", id);
      await deleteDoc(docRef);
      setOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleModalOpen = (type) => {
    setModalType(type);
    setOpen(true);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(database, "cardapio"), (doc) => {
      const docs = [];
      doc.forEach((item) => {
        docs.push({ ...item.data(), id: item.id });
      });
      setCardapio(docs);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
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
            Cardápio
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginTop: "1rem",
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
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </Box>

        {cardapio
          .filter((item) =>
            item.nome.toLowerCase().includes(searchValue.toLowerCase())
          )
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map((item) => (
            <Button
              onClick={() => {
                setOpen(true);
                setName(item.nome);
                setBarcode(item.codigo);
                setId(item.id);
                handleModalOpen("update");
              }}
              key={item.id}
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
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <Typography
                    sx={{
                      borderRight: "1px solid white",
                      paddingRight: "5px",
                    }}
                  >
                    {item.nome}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {`R$ ${item.preco
                      .toLocaleString("pt-br", {
                        minimumFractionDigits: 2,
                      })
                      .replace(".", ",")}

                  `}
                  </Typography>
                </Grid>
              </Grid>
            </Button>
          ))}

        {modalType === "update" && (
          <UpdateModal
            props={{
              open,
              handleClose: () => {
                setOpen(false);
                setName("");
                setPrice("");
                setBarcode("");
              },
              name,
              setName,
              price,
              setPrice,
              handleUpdate,
              barcode,
              setBarcode,
              handleDelete,
            }}
          />
        )}

        {modalType === "add" && (
          <AddModal
            props={{
              open,
              handleClose: () => setOpen(false),
              name,
              setName,
              price,
              setPrice,
              handleAdd,
              barcode,
              setBarcode,
            }}
          />
        )}

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
          onClick={() => handleModalOpen("add")}
        >
          +
        </Button>
      </Box>
      <Box
        sx={{
          marginTop: "10rem",
        }}
      />
    </>
  );
};

export default index;
