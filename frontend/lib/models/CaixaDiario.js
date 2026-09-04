import mongoose from "mongoose";

const CaixaDiarioSchema = new mongoose.Schema(
  {
    data: {
      type: Date,
      required: [true, "Data é obrigatória"],
    },
    saldo_inicial: {
      type: Number,
      required: [true, "Saldo inicial é obrigatório"],
      min: 0,
    },
    saldo_final: {
      type: Number,
      default: null,
    },
    observacoes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["aberto", "fechado"],
      default: "aberto",
    },
    abertoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    fechadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

CaixaDiarioSchema.index({ data: -1 });

export default mongoose.models.CaixaDiario ||
  mongoose.model("CaixaDiario", CaixaDiarioSchema);
