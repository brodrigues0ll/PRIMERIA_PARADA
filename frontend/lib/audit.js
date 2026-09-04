import connectDB from "@/lib/mongodb";
import AuditLog from "@/lib/models/AuditLog";

/**
 * Registra uma ação auditada.
 * @param {object} session - Sessão NextAuth
 * @param {string} acao - Ex: 'caixa.fechar', 'comanda.fechar', 'lancamento.deletar'
 * @param {string} entidade - Nome do model: 'CaixaDiario', 'Comanda', etc.
 * @param {string|null} entidadeId - ObjectId do documento afetado
 * @param {object|null} dados - Snapshot dos dados relevantes
 */
export async function auditLog(session, acao, entidade = null, entidadeId = null, dados = null) {
  try {
    await connectDB();
    await AuditLog.create({
      usuario: session.user.id,
      acao,
      entidade,
      entidadeId: entidadeId || null,
      dados,
    });
  } catch {
    // Auditoria não deve quebrar a operação principal
  }
}

export const ACOES = {
  CAIXA_ABRIR: "caixa.abrir",
  CAIXA_FECHAR: "caixa.fechar",
  LANCAMENTO_CRIAR: "lancamento.criar",
  LANCAMENTO_DELETAR: "lancamento.deletar",
  COMANDA_FECHAR: "comanda.fechar",
  COMANDA_REABRIR: "comanda.reabrir",
  DELIVERY_CANCELAR: "delivery.cancelar",
  DELIVERY_ENTREGAR: "delivery.entregar",
  PRODUTO_PRECO_ALTERAR: "produto.preco.alterar",
  PRODUTO_DELETAR: "produto.deletar",
  SENHA_ALTERAR: "senha.alterar",
  FUNCIONARIO_CRIAR: "funcionario.criar",
  FUNCIONARIO_DESATIVAR: "funcionario.desativar",
};
