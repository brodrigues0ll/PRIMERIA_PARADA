import mongoose from "mongoose";

const SalaoLayoutSchema = new mongoose.Schema({
  linhas: [
    {
      id: { type: String, required: true },
      x1: Number,
      y1: Number,
      x2: Number,
      y2: Number,
      espessura: { type: Number, default: 1.2 },
    },
  ],
}, { timestamps: true });

export default mongoose.models.SalaoLayout ||
  mongoose.model("SalaoLayout", SalaoLayoutSchema);
