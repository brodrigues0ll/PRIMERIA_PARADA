import mongoose from "mongoose";

const EmpresaSchema = new mongoose.Schema(
  {
    nome: { type: String, default: "Primeira Parada", trim: true },
    slogan: { type: String, default: "", trim: true },
    logo: { type: String, default: null }, // base64 data URI ou URL
    cnpj: { type: String, default: "", trim: true },
    telefone: { type: String, default: "", trim: true },
    endereco: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Empresa || mongoose.model("Empresa", EmpresaSchema);
