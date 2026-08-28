import mongoose from "mongoose";

const EnderecoSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Casa" },
    rua: { type: String, default: "" },
    numero: { type: String, default: "" },
    bairro: { type: String, default: "" },
    complemento: { type: String, default: "" },
    referencia: { type: String, default: "" },
  },
  { _id: false }
);

const ClienteSchema = new mongoose.Schema(
  {
    nome: { type: String, required: [true, "Nome é obrigatório"], trim: true },
    telefone: { type: String, default: "", trim: true },
    enderecos: { type: [EnderecoSchema], default: [] },
    perfil_pagamento: {
      type: String,
      enum: ["avista", "semanal", "mensal"],
      default: "avista",
    },
    observacoes: { type: String, default: "" },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ClienteSchema.index({ nome: 1 });
ClienteSchema.index({ telefone: 1 });

export default mongoose.models.Cliente || mongoose.model("Cliente", ClienteSchema);
