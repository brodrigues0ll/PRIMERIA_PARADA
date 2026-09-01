import mongoose from "mongoose";

const EstoqueLocalSchema = new mongoose.Schema(
  {
    produto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
      required: true,
    },
    local: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocalEstoque",
      required: true,
    },
    quantidade: { type: Number, required: true, min: 0, default: 0 },
    minimo: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

EstoqueLocalSchema.index({ produto: 1, local: 1 }, { unique: true });

export default mongoose.models.EstoqueLocal ||
  mongoose.model("EstoqueLocal", EstoqueLocalSchema);
