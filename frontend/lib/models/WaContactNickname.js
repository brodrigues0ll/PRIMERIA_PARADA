import mongoose from "mongoose";
const WaContactNicknameSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
}, { timestamps: true });
export default mongoose.models.WaContactNickname || mongoose.model("WaContactNickname", WaContactNicknameSchema);
