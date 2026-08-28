require("dotenv").config();
const app = require("./app");
const { connectDatabase } = require("./config/database");
const { ensureBucket } = require("./config/minio");

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDatabase();
  await ensureBucket();
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}.`));
}

start().catch((err) => {
  console.error("Falha ao iniciar servidor:", err);
  process.exit(1);
});
