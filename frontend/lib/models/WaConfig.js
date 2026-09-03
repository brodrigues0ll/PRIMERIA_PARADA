import mongoose from "mongoose";
const WaConfigSchema = new mongoose.Schema({
  colorLabels: { type: mongoose.Schema.Types.Mixed, default: () => ({ red: "Urgente / Problema", orange: "Aguardando resposta", yellow: "Em atendimento", green: "Atendido / Concluído", teal: "Retirada no balcão", blue: "Delivery saiu", purple: "Cliente VIP", pink: "Reembolso / Reclamação", gray: "Sem prioridade", brown: "Fornecedor" }) },
}, { timestamps: true });
export default mongoose.models.WaConfig || mongoose.model("WaConfig", WaConfigSchema);
