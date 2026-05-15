import mongoose from "mongoose";

const EstoqueSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
      unique: true,
    },
    quantidade: { type: Number, default: 0, min: 0 },
    minimo: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Estoque || mongoose.model("Estoque", EstoqueSchema);
