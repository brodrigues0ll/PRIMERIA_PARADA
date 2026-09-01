import mongoose from "mongoose";

const EnderecoSalvoSchema = new mongoose.Schema(
  {
    rua: { type: String, required: true },
    numero: { type: String, default: "" },
    bairro: { type: String, default: "" },
    complemento: { type: String, default: "" },
    referencia: { type: String, default: "" },
    usos: { type: Number, default: 1 },
  },
  { timestamps: true }
);

EnderecoSalvoSchema.index({ rua: "text", bairro: "text" });

export default mongoose.models.EnderecoSalvo ||
  mongoose.model("EnderecoSalvo", EnderecoSalvoSchema);
