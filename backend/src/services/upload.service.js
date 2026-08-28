const { minioClient, BUCKET } = require("../config/minio");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXT_MAP = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function uploadImage(file) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    const err = new Error("Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.");
    err.status = 400;
    throw err;
  }

  const ext = EXT_MAP[file.mimetype];
  const filename = `${crypto.randomUUID()}.${ext}`;

  await minioClient.putObject(BUCKET, filename, file.buffer, file.size, {
    "Content-Type": file.mimetype,
  });

  const publicUrl = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
  return `${publicUrl}/${BUCKET}/${filename}`;
}

module.exports = { uploadImage };
