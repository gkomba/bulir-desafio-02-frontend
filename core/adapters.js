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
  imageUrl: service.imageUrl ?? undefined,
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
  createdAt: booking.createdAt,
});
