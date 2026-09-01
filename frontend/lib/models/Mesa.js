import mongoose from "mongoose";

const MesaSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  capacidade: { type: Number, default: null },
  posicao: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  ordem: { type: Number, default: 0 },
  ativa: { type: Boolean, default: true },
}, { timestamps: true });

MesaSchema.index({ ativa: 1, ordem: 1 });

export default mongoose.models.Mesa || mongoose.model("Mesa", MesaSchema);
