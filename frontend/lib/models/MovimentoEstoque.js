import mongoose from "mongoose";

const MovimentoEstoqueSchema = new mongoose.Schema(
  {
    produto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
      required: true,
    },
    tipo: { type: String, enum: ["entrada", "saida", "ajuste", "transferencia"], required: true },
    quantidade: { type: Number, required: true },
    quantidadeAnterior: { type: Number, required: true },
    quantidadeNova: { type: Number, required: true },
    observacao: { type: String, default: "", trim: true },
    local_origem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocalEstoque",
      default: null,
    },
    local_destino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocalEstoque",
      default: null,
    },
    fornecedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fornecedor",
      default: null,
    },
  },
  { timestamps: true }
);

MovimentoEstoqueSchema.index({ produto: 1, createdAt: -1 });

export default mongoose.models.MovimentoEstoque ||
  mongoose.model("MovimentoEstoque", MovimentoEstoqueSchema);
