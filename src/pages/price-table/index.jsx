import Header from "@/components/Header";
import { Box, Button, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  collection,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { database } from "@/services/firebase";
import UpdateModal from "@/components/UpdateModal";
import AddModal from "@/components/AddModal";

const getCacheData = () => {
  const cacheData = localStorage.getItem("cardapioCache");
  return cacheData ? JSON.parse(cacheData) : [];
};

const setCacheData = (data) => {
  localStorage.setItem("cardapioCache", JSON.stringify(data));
};

const index = () => {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const [modalType, setModalType] = useState("");
  const [cardapio, setCardapio] = useState(getCacheData());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineEdits, setOfflineEdits] = useState([]);

  const handleAdd = async () => {
    if (isOnline) {
      try {
        const docRef = await addDoc(collection(database, "cardapio"), {
          nome: name,
          preco: price,
          codigo: barcode,
        });

        setCardapio((prevCardapio) => [
          ...prevCardapio,
          { id: docRef.id, nome: name, preco: price, codigo: barcode },
        ]);

        setName("");
        setPrice("");
        setBarcode("");
      } catch (error) {
        console.log(error);
      }
    } else {
      const newEdit = {
        type: "add",
        name: name,
        price: price,
        barcode: barcode,
      };

      setOfflineEdits((prevEdits) => [...prevEdits, newEdit]);

      setName("");
      setPrice("");
      setBarcode("");
    }
  };

  const handleUpdate = async () => {
    if (isOnline) {
      try {
        const docRef = doc(database, "cardapio", id);
        await updateDoc(docRef, {
          nome: name,
          preco: price,
          codigo: barcode,
        });

        setCardapio((prevCardapio) =>
          prevCardapio.map((item) =>
            item.id === id
              ? { ...item, nome: name, preco: price, codigo: barcode }
              : item
          )
        );

        setOpen(false);
      } catch (error) {
        console.log(error);
      }
    } else {
      const newEdit = {
        type: "update",
        id: id,
        name: name,
        price: price,
        barcode: barcode,
      };

      setOfflineEdits((prevEdits) => [...prevEdits, newEdit]);

      setOpen(false);
      setName("");
      setPrice("");
      setBarcode("");
    }
  };

  const handleDelete = async () => {
    if (isOnline) {
      try {
        const docRef = doc(database, "cardapio", id);
        await deleteDoc(docRef);

        setCardapio((prevCardapio) =>
          prevCardapio.filter((item) => item.id !== id)
        );

        setOpen(false);
      } catch (error) {
        console.log(error);
      }
    } else {
      const newEdit = {
        type: "delete",
        id: id,
      };

      setOfflineEdits((prevEdits) => [...prevEdits, newEdit]);

      setOpen(false);

      setName("");
      setPrice("");
      setBarcode("");
    }
  };

  const sendOfflineEdits = async () => {
    for (const edit of offlineEdits) {
      try {
        if (edit.type === "add") {
          const docRef = await addDoc(collection(database, "cardapio"), {
            nome: edit.name,
            preco: edit.price,
            codigo: edit.barcode,
          });
          setCardapio((prevCardapio) => [
            ...prevCardapio,
            {
              id: docRef.id,
              nome: edit.name,
              preco: edit.price,
              codigo: edit.barcode,
            },
          ]);
        } else if (edit.type === "update") {
          const docRef = doc(database, "cardapio", edit.id);
          await updateDoc(docRef, {
            nome: edit.name,
            preco: edit.price,
            codigo: edit.barcode,
          });

          setCardapio((prevCardapio) =>
            prevCardapio.map((item) =>
              item.id === edit.id
                ? {
                    ...item,
                    nome: edit.name,
                    preco: edit.price,
                    codigo: edit.barcode,
                  }
                : item
            )
          );
        } else if (edit.type === "delete") {
          const docRef = doc(database, "cardapio", edit.id);
          await deleteDoc(docRef);

          setCardapio((prevCardapio) =>
            prevCardapio.filter((item) => item.id !== edit.id)
          );
        }
      } catch (error) {
        console.log(error);
      }
    }

    setOfflineEdits([]);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      const cachedData = getCacheData();
      setCardapio(cachedData);
    } else if (isOnline && offlineEdits.length > 0) {
      sendOfflineEdits();
    }
  }, [isOnline]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(database, "cardapio"),
      (snapshot) => {
        const docs = [];
        snapshot.forEach((item) => {
          docs.push({ ...item.data(), id: item.id });
        });
        setCardapio(docs);
        setCacheData(docs);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleModalOpen = (type) => {
    setModalType(type);
    setOpen(true);
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
            fontFamily: "MilkyMatcha",
          }}
        >
          Cardápio
        </Typography>

        {cardapio.map((item) => (
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
