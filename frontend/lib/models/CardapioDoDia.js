import mongoose from "mongoose";

const ItemDoDiaSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    nivel: { type: String, enum: ["muito", "pouco", "esgotado"], default: "muito" },
  },
  { _id: false }
);

const CardapioDoDiaSchema = new mongoose.Schema(
  {
    data: { type: Date, required: true, unique: true }, // always midnight UTC
    itens: [ItemDoDiaSchema],
  },
  { timestamps: true }
);

CardapioDoDiaSchema.index({ data: 1 }, { unique: true });

export default mongoose.models.CardapioDoDia ||
  mongoose.model("CardapioDoDia", CardapioDoDiaSchema);
