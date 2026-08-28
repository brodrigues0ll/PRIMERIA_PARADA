import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema(
  {
    nome: { type: String, required: [true, "Nome é obrigatório"], trim: true },
    preco: { type: Number, required: [true, "Preço é obrigatório"], min: [0, "Preço não pode ser negativo"] },
    // link opcional a um produto do estoque para controle de quantidade ao vender
    produtoRef: { type: mongoose.Schema.Types.ObjectId, ref: "Produto", default: null },
  },
  { timestamps: true }
);

MenuItemSchema.index({ nome: 1 });

export default mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);
