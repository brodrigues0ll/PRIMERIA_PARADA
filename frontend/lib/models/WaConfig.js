import mongoose from "mongoose";

const WaConfigSchema = new mongoose.Schema({
  _singleton: { type: String, default: "global", unique: true },
  colorLabels: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      red: "Urgente / Problema",
      orange: "Aguardando resposta",
      yellow: "Em atendimento",
      green: "Atendido / Concluído",
      teal: "Retirada no balcão",
      blue: "Delivery saiu",
      purple: "Cliente VIP",
      pink: "Reembolso / Reclamação",
      gray: "Sem prioridade",
      brown: "Fornecedor",
    }),
  },
  resetHorario: { type: String, default: null },
  lastResetAt: { type: Date, default: null },
  chatColors: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true });

// Força recriação em hot-reload (dev) para que novos campos do schema
// não sejam descartados pelo strict mode do Mongoose.
delete mongoose.models.WaConfig;
export default mongoose.model("WaConfig", WaConfigSchema);
