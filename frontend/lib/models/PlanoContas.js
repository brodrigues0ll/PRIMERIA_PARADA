import mongoose from "mongoose";

const PlanoContasSchema = new mongoose.Schema(
  {
    nome: { type: String, required: [true, "Nome é obrigatório"], trim: true },
    tipo: {
      type: String,
      enum: ["entrada", "saida"],
      required: [true, "Tipo é obrigatório"],
    },
    ordem: { type: Number, default: 0 },
    ativo: { type: Boolean, default: true },
    sistema: { type: Boolean, default: false }, // categorias padrão não deletáveis
  },
  { timestamps: true }
);

PlanoContasSchema.index({ tipo: 1, ordem: 1 });

export default mongoose.models.PlanoContas ||
  mongoose.model("PlanoContas", PlanoContasSchema);
