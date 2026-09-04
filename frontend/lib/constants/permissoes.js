export const PERMISSOES_DISPONIVEIS = [
  // Módulos de navegação
  { id: "orders",        label: "Comandas",          grupo: "Salão" },
  { id: "salao",         label: "Salão",              grupo: "Salão" },
  { id: "delivery",      label: "Delivery",           grupo: "Delivery" },
  { id: "clientes",      label: "Clientes",           grupo: "Delivery" },
  { id: "pdv",           label: "PDV",                grupo: "Vendas" },
  { id: "price-table",   label: "Cardápio",           grupo: "Vendas" },
  { id: "estoque",       label: "Estoque",            grupo: "Estoque" },
  { id: "financeiro",    label: "Financeiro",         grupo: "Financeiro" },
  { id: "whatsapp",      label: "WhatsApp",           grupo: "WhatsApp" },
  { id: "configuracoes", label: "Configurações",      grupo: "Admin" },

  // Ações granulares
  { id: "orders.close",   label: "Fechar comanda",       grupo: "Salão" },
  { id: "orders.reopen",  label: "Reabrir comanda",      grupo: "Salão" },
  { id: "delivery.cancel",label: "Cancelar delivery",    grupo: "Delivery" },
  { id: "financeiro.caixa",    label: "Abrir/fechar caixa",  grupo: "Financeiro" },
  { id: "financeiro.relatorios",label: "Ver relatórios",    grupo: "Financeiro" },
  { id: "estoque.entrada", label: "Entrada no estoque",  grupo: "Estoque" },
  { id: "config.equipe",  label: "Gerenciar equipe",     grupo: "Admin" },
];

export const GRUPOS_PERMISSOES = [
  ...new Set(PERMISSOES_DISPONIVEIS.map((p) => p.grupo)),
];

export const PERMISSOES_POR_GRUPO = GRUPOS_PERMISSOES.reduce((acc, grupo) => {
  acc[grupo] = PERMISSOES_DISPONIVEIS.filter((p) => p.grupo === grupo);
  return acc;
}, {});
