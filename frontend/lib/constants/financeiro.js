export const CATEGORIAS_ENTRADA = [
  "Vendas salão",
  "Vendas delivery",
  "Taxa de entrega",
  "Gorjeta",
  "Outros",
];

export const CATEGORIAS_SAIDA = [
  "Compra de insumos",
  "Conta de luz",
  "Internet",
  "Funcionários",
  "Aluguel",
  "Outros",
];

export const FORMAS_PAGAMENTO = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "credito", label: "Crédito" },
  { value: "debito", label: "Débito" },
  { value: "conta", label: "Na conta" },
  { value: "misto", label: "Misto" },
];

export const FORMA_PAGAMENTO_LABEL = Object.fromEntries(
  FORMAS_PAGAMENTO.map((f) => [f.value, f.label])
);
