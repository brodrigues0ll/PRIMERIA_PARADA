import mongoose from "mongoose";

const PagamentoClienteSchema = new mongoose.Schema(
  {
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", required: true },
    valor: { type: Number, required: true, min: 0 },
    pedidos_quitados: [{ type: mongoose.Schema.Types.ObjectId, ref: "PedidoDelivery" }],
    observacao: { type: String, default: "" },
  },
  { timestamps: true }
);

PagamentoClienteSchema.index({ cliente: 1 });

export default mongoose.models.PagamentoCliente || mongoose.model("PagamentoCliente", PagamentoClienteSchema);
