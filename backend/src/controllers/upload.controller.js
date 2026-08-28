const { uploadImage } = require("../services/upload.service");
const { success, failure } = require("../utils/response");

async function uploadImageController(req, res, next) {
  try {
    if (!req.file) return failure(res, "Nenhum arquivo enviado.", 400);
    const url = await uploadImage(req.file);
    return success(res, { url }, 201);
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImageController };
