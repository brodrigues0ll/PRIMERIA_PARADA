import mongoose from "mongoose";

const CategoriaSchema = new mongoose.Schema(
  {
    nome: { type: String, required: [true, "Nome é obrigatório"], trim: true },
    ordem: { type: Number, default: 0 },
    cor: { type: String, default: null }, // hex color, e.g. "#25d366"
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategoriaSchema.index({ ordem: 1 });

export default mongoose.models.Categoria || mongoose.model("Categoria", CategoriaSchema);
