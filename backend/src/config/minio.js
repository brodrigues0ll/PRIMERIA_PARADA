const { Client } = require("minio");

const BUCKET = process.env.MINIO_BUCKET || "produtos";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT_HOST || "minio",
  port: parseInt(process.env.MINIO_ENDPOINT_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ROOT_USER || "minioadmin",
  secretKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin",
});

async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
    const policy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET}/*`],
        },
      ],
    });
    await minioClient.setBucketPolicy(BUCKET, policy);
    console.log(`Bucket '${BUCKET}' criado com acesso público de leitura.`);
  }
}

module.exports = { minioClient, BUCKET, ensureBucket };
