import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email é obrigatório"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Senha é obrigatória"],
      select: false,
    },
    name: { type: String, trim: true },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    foto: { type: String, default: null },
    ativo: { type: Boolean, default: true },
    cargo: { type: String, default: "", trim: true },
    permissionGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PermissionGroup",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
