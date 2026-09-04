import mongoose from "mongoose";

export const PERMISSOES_DISPONIVEIS = [
  // Módulos de navegação
  "pdv",
  "orders",
  "estoque",
  "price-table",
  "configuracoes",
  "delivery",
  "clientes",
  "salao",
  "financeiro",
  "whatsapp",
  // Ações granulares
  "orders.close",
  "orders.reopen",
  "delivery.cancel",
  "financeiro.caixa",
  "financeiro.relatorios",
  "estoque.entrada",
  "config.equipe",
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
