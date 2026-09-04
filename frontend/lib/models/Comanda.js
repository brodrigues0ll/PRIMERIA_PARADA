import mongoose from "mongoose";

const ComandaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "Nome do cliente é obrigatório"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["aberta", "fechada"],
      default: "aberta",
    },
    abertaEm: {
      type: Date,
      default: Date.now,
    },
    fechadaEm: {
      type: Date,
      default: null,
    },
    mesa: { type: mongoose.Schema.Types.ObjectId, ref: "Mesa", default: null },
    grupo: { type: mongoose.Schema.Types.ObjectId, ref: "GrupoMesas", default: null },
    pagantes: { type: [String], default: [] },
    pagantesPagos: { type: [String], default: [] },
    fechadaPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    totalFechamento: { type: Number, default: null },
    formaPagamentoFechamento: {
      type: String,
      enum: ["dinheiro", "pix", "credito", "debito", "conta", "misto", null],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ComandaSchema.virtual("pedidos", {
  ref: "Pedido",
  localField: "_id",
  foreignField: "comanda",
});

ComandaSchema.index({ status: 1, abertaEm: -1 });

export default mongoose.models.Comanda || mongoose.model("Comanda", ComandaSchema);
