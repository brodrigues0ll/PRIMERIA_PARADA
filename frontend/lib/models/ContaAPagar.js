import mongoose from "mongoose";

const ContaAPagarSchema = new mongoose.Schema(
  {
    descricao: {
      type: String,
      required: [true, "Descrição é obrigatória"],
      trim: true,
    },
    valor: {
      type: Number,
      required: [true, "Valor é obrigatório"],
      min: 0,
    },
    vencimento: {
      type: Date,
      required: [true, "Vencimento é obrigatório"],
    },
    categoria: {
      type: String,
      required: [true, "Categoria é obrigatória"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pendente", "pago"],
      default: "pendente",
    },
    pago_em: {
      type: Date,
      default: null,
    },
    lancamento: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LancamentoFinanceiro",
      default: null,
    },
    observacoes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

ContaAPagarSchema.index({ status: 1, vencimento: 1 });

export default mongoose.models.ContaAPagar ||
  mongoose.model("ContaAPagar", ContaAPagarSchema);
