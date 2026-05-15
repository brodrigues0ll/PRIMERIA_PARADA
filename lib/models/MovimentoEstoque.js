import mongoose from "mongoose";

const MovimentoEstoqueSchema = new mongoose.Schema(
  {
    produto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
      required: true,
    },
    tipo: { type: String, enum: ["entrada", "saida", "ajuste"], required: true },
    quantidade: { type: Number, required: true },
    quantidadeAnterior: { type: Number, required: true },
    quantidadeNova: { type: Number, required: true },
    observacao: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

MovimentoEstoqueSchema.index({ produto: 1, createdAt: -1 });

export default mongoose.models.MovimentoEstoque ||
  mongoose.model("MovimentoEstoque", MovimentoEstoqueSchema);
