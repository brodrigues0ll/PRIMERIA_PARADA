import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    nome: { type: String },
    preco: { type: Number },
    quantidade: { type: Number, default: 1 },
    observacao: { type: String, default: "" },
  },
  { _id: false }
);

const EnderecoEntregaSchema = new mongoose.Schema(
  {
    rua: { type: String, default: "" },
    numero: { type: String, default: "" },
    bairro: { type: String, default: "" },
    complemento: { type: String, default: "" },
    referencia: { type: String, default: "" },
  },
  { _id: false }
);

const PedidoDeliverySchema = new mongoose.Schema(
  {
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", default: null },
    nome_avulso: { type: String, default: null },
    endereco_entrega: { type: EnderecoEntregaSchema, default: () => ({}) },
    itens: { type: [ItemSchema], default: [] },
    total: { type: Number, required: true },
    forma_pagamento: {
      type: String,
      enum: ["dinheiro", "pix", "cartao"],
      required: true,
    },
    troco_para: { type: Number, default: null },
    status: {
      type: String,
      enum: ["recebido", "em_preparo", "saiu", "entregue", "cancelado"],
      default: "recebido",
    },
    na_conta: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PedidoDeliverySchema.index({ status: 1 });
PedidoDeliverySchema.index({ cliente: 1 });
PedidoDeliverySchema.index({ createdAt: -1 });

export default mongoose.models.PedidoDelivery || mongoose.model("PedidoDelivery", PedidoDeliverySchema);
