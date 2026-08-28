import mongoose from "mongoose";

const PedidoSchema = new mongoose.Schema(
  {
    comanda: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comanda",
      required: true,
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
    },
    nome: {
      type: String,
      required: [true, "Nome do item é obrigatório"],
    },
    preco: {
      type: Number,
      required: [true, "Preço é obrigatório"],
      min: [0, "Preço não pode ser negativo"],
    },
    quantidade: {
      type: Number,
      required: true,
      min: [1, "Quantidade mínima é 1"],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

PedidoSchema.index({ comanda: 1 });

export default mongoose.models.Pedido || mongoose.model("Pedido", PedidoSchema);
