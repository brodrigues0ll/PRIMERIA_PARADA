/**
 * Seed dos grupos de permissão padrão (RBAC).
 * Executar: node --experimental-vm-modules scripts/seed-rbac.js
 * ou: node scripts/seed-rbac.js  (se package.json tiver "type": "module")
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI não definida"); process.exit(1); }

await mongoose.connect(MONGODB_URI);

const { default: PermissionGroup } = await import("../lib/models/PermissionGroup.js");

const GRUPOS = [
  {
    nome: "Atendente",
    descricao: "Responsável pelo atendimento no salão. Pode abrir e fechar comandas.",
    permissoes: [
      "orders",
      "salao",
      "price-table",
      "orders.close",
    ],
  },
  {
    nome: "Caixa",
    descricao: "Operador de caixa. Gerencia lançamentos financeiros e fecha comandas.",
    permissoes: [
      "orders",
      "salao",
      "pdv",
      "financeiro",
      "financeiro.caixa",
      "orders.close",
      "orders.reopen",
    ],
  },
  {
    nome: "Cozinha",
    descricao: "Visualiza pedidos e comandas. Sem acesso financeiro.",
    permissoes: [
      "orders",
    ],
  },
  {
    nome: "Entregador",
    descricao: "Responsável pelas entregas. Acessa e avança status de pedidos delivery.",
    permissoes: [
      "delivery",
      "clientes",
    ],
  },
  {
    nome: "Gerente",
    descricao: "Acesso amplo: vendas, financeiro, estoque e relatórios. Sem configurações de sistema.",
    permissoes: [
      "pdv",
      "orders",
      "salao",
      "delivery",
      "clientes",
      "financeiro",
      "financeiro.caixa",
      "financeiro.relatorios",
      "estoque",
      "estoque.entrada",
      "price-table",
      "whatsapp",
      "orders.close",
      "orders.reopen",
      "delivery.cancel",
    ],
  },
  {
    nome: "Estoquista",
    descricao: "Responsável pelo controle de estoque.",
    permissoes: [
      "estoque",
      "estoque.entrada",
    ],
  },
];

let criados = 0;
let atualizados = 0;

for (const grupo of GRUPOS) {
  const existente = await PermissionGroup.findOne({ nome: grupo.nome });
  if (existente) {
    await PermissionGroup.findByIdAndUpdate(existente._id, {
      descricao: grupo.descricao,
      permissoes: grupo.permissoes,
    });
    console.log(`↻  Atualizado: ${grupo.nome} (${grupo.permissoes.length} permissões)`);
    atualizados++;
  } else {
    await PermissionGroup.create(grupo);
    console.log(`✓  Criado:     ${grupo.nome} (${grupo.permissoes.length} permissões)`);
    criados++;
  }
}

console.log(`\nSeed RBAC concluído. ${criados} criados, ${atualizados} atualizados.`);
await mongoose.disconnect();
