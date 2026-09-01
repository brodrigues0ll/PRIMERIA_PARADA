import mongoose from "mongoose";

const NomeAvulsoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, unique: true },
    usos: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.NomeAvulso ||
  mongoose.model("NomeAvulso", NomeAvulsoSchema);
