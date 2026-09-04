import mongoose from "mongoose";

const LancamentoFinanceiroSchema = new mongoose.Schema(
  {
    caixa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaixaDiario",
      required: [true, "Caixa é obrigatório"],
    },
    tipo: {
      type: String,
      enum: ["entrada", "saida"],
      required: [true, "Tipo é obrigatório"],
    },
    categoria: {
      type: String,
      required: [true, "Categoria é obrigatória"],
      trim: true,
    },
    valor: {
      type: Number,
      required: [true, "Valor é obrigatório"],
      min: 0,
    },
    descricao: {
      type: String,
      default: "",
      trim: true,
    },
    data: {
      type: Date,
      default: Date.now,
    },
    forma_pagamento: {
      type: String,
      enum: ["dinheiro", "pix", "cartao", "credito", "debito", "conta", "misto", null],
      default: null,
    },
    membro_familiar: {
      type: String,
      default: null,
    },
    referencia: {
      type: String,
      default: null,
    },
    criadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    origem: {
      type: String,
      enum: ["manual", "comanda", "delivery", "pdv"],
      default: "manual",
    },
  },
  { timestamps: true }
);

LancamentoFinanceiroSchema.index({ caixa: 1, data: -1 });

export default mongoose.models.LancamentoFinanceiro ||
  mongoose.model("LancamentoFinanceiro", LancamentoFinanceiroSchema);
