import mongoose from "mongoose";

const FornecedorSchema = new mongoose.Schema(
  {
    nome: { type: String, required: [true, "Nome é obrigatório"], trim: true },
    cnpj: { type: String, default: "", trim: true },
    telefone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    contato: { type: String, default: "", trim: true },
    observacoes: { type: String, default: "", trim: true },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FornecedorSchema.index({ nome: 1 });
FornecedorSchema.index({ ativo: 1 });

export default mongoose.models.Fornecedor ||
  mongoose.model("Fornecedor", FornecedorSchema);
