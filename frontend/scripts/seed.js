/**
 * Script de seed: define role "admin" no primeiro usuário e cria documento Empresa.
 * Executar: node scripts/seed.js
 *
 * Requer variáveis de ambiente: MONGODB_URI
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI não definida"); process.exit(1); }

await mongoose.connect(MONGODB_URI);

// Importa models dinamicamente para garantir registro
const { default: User } = await import("../lib/models/User.js");
const { default: Empresa } = await import("../lib/models/Empresa.js");

// 1. Define role admin no primeiro usuário (ou no usuário com email específico)
const adminEmail = process.env.ADMIN_EMAIL || null;
const query = adminEmail ? { email: adminEmail } : {};
const firstUser = await User.findOne(query).sort({ createdAt: 1 });

if (firstUser) {
  await User.findByIdAndUpdate(firstUser._id, { role: "admin", ativo: true });
  console.log(`✓ Usuário ${firstUser.email} agora tem role "admin"`);
} else {
  console.log("⚠ Nenhum usuário encontrado. Crie um usuário primeiro.");
}

// 2. Cria documento Empresa se não existir
const empresa = await Empresa.findOne({});
if (!empresa) {
  await Empresa.create({ nome: "Primeira Parada" });
  console.log("✓ Empresa criada com configurações padrão");
} else {
  console.log(`✓ Empresa já existe: ${empresa.nome}`);
}

await mongoose.disconnect();
console.log("Seed concluído.");
