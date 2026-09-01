import mongoose from "mongoose";

const MembroFamiliarSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.MembroFamiliar ||
  mongoose.model("MembroFamiliar", MembroFamiliarSchema);
