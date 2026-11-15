// Converte os dados da API (desafio 1) para o formato que o painel usa.
// A API guarda dinheiro em cêntimos; o painel mostra e edita Kwanzas.
const CATEGORY_LABELS = {
  HOME: "Casa",
  BEAUTY: "Beleza",
  TECHNOLOGY: "Tecnologia",
  EDUCATION: "Educação",
  HEALTH: "Saúde",
  EVENTS: "Eventos",
  AUTOMOTIVE: "Automóvel",
  OTHER: "Outros",
};

export const categoryLabel = (category) =>
  CATEGORY_LABELS[category] ?? CATEGORY_LABELS.OTHER;

// O inverso: o painel mostra "Casa" e a API guarda HOME.
export const categoryCode = (label) =>
  Object.keys(CATEGORY_LABELS).find((code) => CATEGORY_LABELS[code] === label) ??
  "OTHER";

export const toCents = (kwanzas) => Math.round(Number(kwanzas) * 100);
const toKwanzas = (cents) => cents / 100;

export const toUser = (user) => ({
  id: user.id,
  name: user.fullName,
  email: user.email,
  nif: user.nif ?? undefined,
  role: user.role,
  balance: toKwanzas(user.balanceCents),
});

export const toService = (service) => ({
  id: service.id,
  title: service.name,
  description: service.description,
  price: toKwanzas(service.priceCents),
  category: categoryLabel(service.category),
  providerId: service.providerId,
  // A API não devolve o nome do prestador nos serviços.
  providerName: "Prestador",
  imageUrl: service.imageUrl ?? undefined,
});

// O corpo para criar ou editar um serviço. `imageUrl`: um endereço põe ou muda a imagem,
// `null` tira-a e ausente deixa-a como está.
export const toServiceBody = ({
  title,
  description,
  price,
  category,
  imageUrl,
}) => ({
  name: title.trim(),
  description: description.trim(),
  priceCents: toCents(price),
  category: categoryCode(category),
  ...(imageUrl !== undefined && { imageUrl }),
});

// Uma contratação é a transação que o histórico mostra.
export const toTransaction = (booking) => ({
  id: booking.id,
  serviceTitle: booking.serviceName,
  providerId: booking.providerId,
  providerName: booking.providerName,
  clientId: booking.clientId,
  clientName: booking.clientName,
  amount: toKwanzas(booking.priceCents),
  status: booking.status,
  scheduledAt: booking.scheduledAt,
  createdAt: booking.createdAt,
});

const STATUS_LABELS = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};
export const statusLabel = (status) => STATUS_LABELS[status] ?? status;
