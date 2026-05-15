import mongoose from "mongoose";

export const PERMISSOES_DISPONIVEIS = [
  "pdv",
  "orders",
  "estoque",
  "price-table",
  "configuracoes",
];

const PermissionGroupSchema = new mongoose.Schema(
  {
    nome: { type: String, required: [true, "Nome é obrigatório"], unique: true, trim: true },
    descricao: { type: String, default: "", trim: true },
    permissoes: [{ type: String, enum: PERMISSOES_DISPONIVEIS }],
  },
  { timestamps: true }
);

export default mongoose.models.PermissionGroup ||
  mongoose.model("PermissionGroup", PermissionGroupSchema);
