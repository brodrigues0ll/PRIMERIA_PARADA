/**
 * Script de migração: Firebase Firestore → MongoDB
 *
 * Uso:
 *   node scripts/migrate-firebase-to-mongodb.js
 *
 * Requer Node 18+ (fetch nativo).
 * Lê credenciais de .env.local automaticamente.
 */

const path = require("path");
const fs = require("fs");

// Carrega .env.local manualmente (sem dependência de dotenv)
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local não encontrado");
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, "$1");
    process.env[key] = val;
  }
}

loadEnv();

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const MONGODB_URI = process.env.MONGODB_URI;

if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID || !MONGODB_URI) {
  console.error("Variáveis de ambiente faltando. Verifique .env.local");
  process.exit(1);
}

const FIREBASE_AUTH_EMAIL = process.env.FIREBASE_MIGRATION_EMAIL;
const FIREBASE_AUTH_PASSWORD = process.env.FIREBASE_MIGRATION_PASSWORD;

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// ──────────────────────────────────────────────
// Autenticação Firebase (REST)
// ──────────────────────────────────────────────

async function getFirebaseToken() {
  if (!FIREBASE_AUTH_EMAIL || !FIREBASE_AUTH_PASSWORD) {
    throw new Error(
      "Adicione ao .env.local:\n  FIREBASE_MIGRATION_EMAIL=seu@email.com\n  FIREBASE_MIGRATION_PASSWORD=suasenha"
    );
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: FIREBASE_AUTH_EMAIL,
        password: FIREBASE_AUTH_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json();
    throw new Error(`Login Firebase falhou: ${body?.error?.message || "Credenciais inválidas"}`);
  }

  const data = await res.json();
  return data.idToken;
}

// ──────────────────────────────────────────────
// Helpers Firestore REST
// ──────────────────────────────────────────────

function parseFirestoreValue(val) {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return Number(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.nullValue !== undefined) return null;
  if (val.timestampValue !== undefined) return new Date(val.timestampValue);
  if (val.arrayValue !== undefined)
    return (val.arrayValue.values || []).map(parseFirestoreValue);
  if (val.mapValue !== undefined) return parseFirestoreFields(val.mapValue.fields || {});
  return null;
}

function parseFirestoreFields(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = parseFirestoreValue(v);
  }
  return obj;
}

function extractId(name) {
  return name.split("/").pop();
}

let _idToken = null;

async function firestoreGet(path, retries = 3) {
  const url = `${FIRESTORE_BASE}/${path}?pageSize=300`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${_idToken}` },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Firestore GET ${path} falhou [${res.status}]: ${body}`);
      }
      return res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`   ⚠️  Tentativa ${i + 1} falhou, retentando...`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function getCollection(collectionPath) {
  const data = await firestoreGet(collectionPath);
  if (!data.documents) return [];
  return data.documents.map((doc) => ({
    _firestoreId: extractId(doc.name),
    ...parseFirestoreFields(doc.fields || {}),
  }));
}

// ──────────────────────────────────────────────
// Mongoose Models (inline para o script)
// ──────────────────────────────────────────────

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, trim: true },
  },
  { timestamps: true }
);

const MenuItemSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    preco: { type: Number, required: true, min: 0 },
    codigo: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const ComandaSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    status: { type: String, enum: ["aberta", "fechada"], default: "aberta" },
    abertaEm: { type: Date, default: Date.now },
    fechadaEm: { type: Date, default: null },
  },
  { timestamps: true }
);

const PedidoSchema = new mongoose.Schema(
  {
    comanda: { type: mongoose.Schema.Types.ObjectId, ref: "Comanda", required: true },
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    nome: { type: String, required: true },
    preco: { type: Number, required: true, min: 0 },
    quantidade: { type: Number, required: true, min: 1, default: 1 },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);
const Comanda = mongoose.models.Comanda || mongoose.model("Comanda", ComandaSchema);
const Pedido = mongoose.models.Pedido || mongoose.model("Pedido", PedidoSchema);

// ──────────────────────────────────────────────
// Helpers de conversão
// ──────────────────────────────────────────────

function parsePreco(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val.replace(",", ".")) || 0;
  return 0;
}

function parseQuantidade(val) {
  const n = Number(val);
  return isNaN(n) || n < 1 ? 1 : n;
}

function parseStatus(val) {
  if (!val) return "aberta";
  return val.toLowerCase() === "fechada" ? "fechada" : "aberta";
}

// Converte string "DD/MM/AAAA, HH:mm:ss" para Date
function parseDataBR(str) {
  if (!str) return null;
  try {
    const [datePart, timePart] = str.split(", ");
    if (!datePart) return null;
    const [day, month, year] = datePart.split("/");
    if (timePart) {
      const [hour, minute, second] = timePart.split(":");
      return new Date(year, month - 1, day, hour, minute, second || 0);
    }
    return new Date(year, month - 1, day);
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// Migração principal
// ──────────────────────────────────────────────

async function migrate() {
  console.log("🔐 Autenticando no Firebase...");
  _idToken = await getFirebaseToken();
  console.log("✅ Firebase autenticado\n");

  console.log("🔌 Conectando ao MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB conectado\n");

  // ── 1. Cardápio ──────────────────────────────
  console.log("📦 Buscando cardápio no Firestore...");
  const cardapioRaw = await getCollection("cardapio");
  console.log(`   ${cardapioRaw.length} itens encontrados`);

  const menuItemMap = {}; // firestoreId → mongoId

  if (cardapioRaw.length > 0) {
    const existingCount = await MenuItem.countDocuments();
    if (existingCount > 0) {
      console.log(`   ℹ️  Cardápio já migrado (${existingCount} itens), pulando...\n`);
    } else {
    for (const item of cardapioRaw) {
      const created = await MenuItem.create({
        nome: item.nome || "Sem nome",
        preco: parsePreco(item.preco),
        codigo: item.codigo || "",
      });
      menuItemMap[item._firestoreId] = created._id;
    }
    console.log(`   ✅ ${cardapioRaw.length} itens migrados para MenuItem\n`);
    }
  } else {
    console.log("   ⚠️  Nenhum item no cardápio\n");
  }

  // Popula menuItemMap com itens já existentes no MongoDB
  if (Object.keys(menuItemMap).length === 0) {
    const existingItems = await MenuItem.find({});
    for (const item of existingItems) {
      // Mapeia por nome como fallback (não temos o firestoreId)
      menuItemMap[item.nome] = item._id;
    }
  }

  // ── 2. Comandas ──────────────────────────────
  console.log("📋 Buscando comandas no Firestore...");
  const comandasRaw = await getCollection("comandas");
  console.log(`   ${comandasRaw.length} comandas encontradas`);

  if (comandasRaw.length === 0) {
    console.log("   ⚠️  Nenhuma comanda encontrada\n");
  } else {
    await Pedido.deleteMany({});
    await Comanda.deleteMany({});

    let totalPedidos = 0;

    for (const comanda of comandasRaw) {
      const status = parseStatus(comanda.status);

      let abertaEm = null;
      let fechadaEm = null;

      // abertaEm pode ser string "DD/MM/AAAA, HH:mm:ss" ou Date
      if (comanda.abertaEm instanceof Date) {
        abertaEm = comanda.abertaEm;
      } else if (typeof comanda.abertaEm === "string") {
        abertaEm = parseDataBR(comanda.abertaEm);
      }

      if (comanda.fechadaEm instanceof Date) {
        fechadaEm = comanda.fechadaEm;
      } else if (typeof comanda.fechadaEm === "string" && comanda.fechadaEm !== "") {
        fechadaEm = parseDataBR(comanda.fechadaEm);
      }

      const created = await Comanda.create({
        nome: comanda.nome || "Sem nome",
        status,
        abertaEm: abertaEm || new Date(),
        fechadaEm: status === "fechada" ? (fechadaEm || new Date()) : null,
      });

      // ── Pedidos (subcollection) ──
      let pedidosRaw = [];
      try {
        pedidosRaw = await getCollection(`comandas/${comanda._firestoreId}/pedidos`);
      } catch (e) {
        // subcollection pode não existir
      }

      for (const pedido of pedidosRaw) {
        const menuItemId = menuItemMap[pedido._firestoreId] || null;

        await Pedido.create({
          comanda: created._id,
          menuItem: menuItemId,
          nome: pedido.nome || "Item",
          preco: parsePreco(pedido.preco),
          quantidade: parseQuantidade(pedido.quantidade),
        });
        totalPedidos++;
      }

      const icon = status === "fechada" ? "🔒" : "🟢";
      console.log(
        `   ${icon} ${comanda.nome} (${status}) — ${pedidosRaw.length} pedido(s)`
      );
    }

    console.log(`\n   ✅ ${comandasRaw.length} comandas migradas`);
    console.log(`   ✅ ${totalPedidos} pedidos migrados\n`);
  }

  // ── 3. Usuário admin ─────────────────────────
  console.log("👤 Verificando usuário admin...");
  const existingUser = await User.findOne({ email: "admin@primeirap.com" });
  if (!existingUser) {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("Admin@123", 10);
    await User.create({
      email: "admin@primeirap.com",
      password: hash,
      name: "Admin",
    });
    console.log("   ✅ Usuário admin criado:");
    console.log("      Email:  admin@primeirap.com");
    console.log("      Senha:  Admin@123");
    console.log("   ⚠️  TROQUE A SENHA após o primeiro login!\n");
  } else {
    console.log("   ℹ️  Usuário admin já existe\n");
  }

  // ── Resumo ───────────────────────────────────
  const totalMenuItems = await MenuItem.countDocuments();
  const totalComandas = await Comanda.countDocuments();
  const totalPedidosDB = await Pedido.countDocuments();

  console.log("═══════════════════════════════════");
  console.log("✅ MIGRAÇÃO CONCLUÍDA");
  console.log(`   MenuItem : ${totalMenuItems}`);
  console.log(`   Comanda  : ${totalComandas}`);
  console.log(`   Pedido   : ${totalPedidosDB}`);
  console.log("═══════════════════════════════════");

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("\n❌ Erro na migração:", err.message);
  process.exit(1);
});
