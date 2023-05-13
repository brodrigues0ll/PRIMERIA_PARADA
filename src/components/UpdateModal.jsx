import React from "react";
import { Button, TextField, Modal, Backdrop, Fade } from "@mui/material";
import MyTextField from "@/components/ComponentTest";

const UpdateModal = ({ props }) => {
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
            id="outlined-basic"
            label="Código de barras"
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
            value={props.barcode}
            onChange={(e) => props.setBarcode(e.target.value)}
          />
          <TextField
            id="outlined-basic"
            label="Nome"
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
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
          />
          <MyTextField
            id="outlined-basic"
            label="Preço"
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
            value={props.price}
            onChange={(value) => {
              props.setPrice(value);
            }}
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
            onClick={props.handleUpdate}
          >
            Salvar
          </Button>

          <Button
            variant="outlined"
            sx={{
              margin: "2rem 0",
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
            onClick={props.handleDelete}
          >
            Deletar
          </Button>
        </div>
      </Fade>
    </Modal>
  );
};

export default UpdateModal;
