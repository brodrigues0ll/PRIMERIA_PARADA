const express = require("express");
const multer = require("multer");
const { uploadImageController } = require("../controllers/upload.controller");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Tipo de arquivo não permitido."));
    }
    cb(null, true);
  },
});

router.post("/image", upload.single("image"), uploadImageController);

module.exports = router;
