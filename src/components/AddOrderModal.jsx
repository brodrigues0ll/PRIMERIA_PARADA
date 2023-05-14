import React from "react";
import { Button, TextField, Modal, Backdrop, Fade } from "@mui/material";
import { collection, addDoc } from "firebase/firestore";
import { database } from "@/services/firebase";

const AddOrderModal = ({ props }) => {
  const [cliente, setCliente] = React.useState("");

  const handleChange = (event) => {
    setCliente(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const docRef = await addDoc(collection(database, "comandas"), {
      nome: cliente,
      status: "aberta",
    });
    console.log("Document written with ID: ", docRef.id);
    setCliente("");
  };

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={props.open}
      onClose={props.handleClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={props.open}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: "80vw",
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
            label="Cliente"
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
            value={cliente}
            onChange={handleChange}
          />

          <Button
            variant="outlined"
            sx={{
              fontFamily: "MilkyMatcha",
              color: "#fff",
              borderColor: "red",
              borderWidth: "2px",
              width: "60%",
              boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.75)",
              ":hover": {
                borderColor: "#fff",
                borderWidth: "2px",
                bgcolor: "#202020",
              },
            }}
            onClick={handleSubmit}
          >
            Criar
          </Button>
        </div>
      </Fade>
    </Modal>
  );
};

export default AddOrderModal;
