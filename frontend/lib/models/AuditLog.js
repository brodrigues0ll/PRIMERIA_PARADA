import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    acao: { type: String, required: true },
    entidade: { type: String, default: null },
    entidadeId: { type: mongoose.Schema.Types.ObjectId, default: null },
    dados: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: true }
);

AuditLogSchema.index({ usuario: 1, createdAt: -1 });
AuditLogSchema.index({ acao: 1, createdAt: -1 });
AuditLogSchema.index({ entidade: 1, entidadeId: 1 });

export default mongoose.models.AuditLog ||
  mongoose.model("AuditLog", AuditLogSchema);
