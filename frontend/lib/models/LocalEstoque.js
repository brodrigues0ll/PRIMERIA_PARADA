import mongoose from "mongoose";

const LocalEstoqueSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true, unique: true },
    tipo: {
      type: String,
      enum: ["freezer_bebidas", "freezer_insumos", "despensa", "geladeira", "outro"],
      default: "outro",
    },
    descricao: { type: String, default: "", trim: true },
    ativo: { type: Boolean, default: true },
    ordem: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.LocalEstoque ||
  mongoose.model("LocalEstoque", LocalEstoqueSchema);
