import mongoose from "mongoose";

const GrupoMesasSchema = new mongoose.Schema({
  mesas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Mesa" }],
  comanda: { type: mongoose.Schema.Types.ObjectId, ref: "Comanda", default: null },
  ativo: { type: Boolean, default: true },
  abertaEm: { type: Date, default: Date.now },
  fechadaEm: { type: Date, default: null },
}, { timestamps: true });

GrupoMesasSchema.index({ ativo: 1 });

export default mongoose.models.GrupoMesas || mongoose.model("GrupoMesas", GrupoMesasSchema);
