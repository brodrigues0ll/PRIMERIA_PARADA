import mongoose from "mongoose";

const ProdutoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: [true, "Nome é obrigatório"], trim: true },
    codigo: { type: String, default: "", trim: true },
    precoCompra: { type: Number, default: 0, min: 0 },
    precoVenda: { type: Number, default: 0, min: 0 },
    quantidade: { type: Number, default: 0, min: 0 },
    minimo: { type: Number, default: 0, min: 0 },
    imagem: { type: String, default: null }, // base64 data URI
  },
  { timestamps: true }
);

ProdutoSchema.index({ nome: 1 });
ProdutoSchema.index({ codigo: 1 });

export default mongoose.models.Produto || mongoose.model("Produto", ProdutoSchema);
