// Converte os dados da API (desafio 1) para o formato que o painel usa.
// A API guarda dinheiro em cêntimos; o painel mostra e edita Kwanzas.
import type {
  BookingDto,
  BookingStatus,
  CategoryCode,
  CategoryLabel,
  Service,
  ServiceDto,
  ServiceInput,
  Transaction,
  User,
  UserDto,
} from "../types/domain.ts";

const CATEGORY_LABELS: Record<CategoryCode, CategoryLabel> = {
  HOME: "Casa",
  BEAUTY: "Beleza",
  TECHNOLOGY: "Tecnologia",
  EDUCATION: "Educação",
  HEALTH: "Saúde",
  EVENTS: "Eventos",
  AUTOMOTIVE: "Automóvel",
  OTHER: "Outros",
};

export const categoryLabel = (category: string | undefined): CategoryLabel =>
  CATEGORY_LABELS[category as CategoryCode] ?? CATEGORY_LABELS.OTHER;

// O inverso: o painel mostra "Casa" e a API guarda HOME.
export const categoryCode = (label: string): CategoryCode =>
  (Object.keys(CATEGORY_LABELS) as CategoryCode[]).find(
    (code) => CATEGORY_LABELS[code] === label,
  ) ?? "OTHER";

export const toCents = (kwanzas: number | string): number =>
  Math.round(Number(kwanzas) * 100);
const toKwanzas = (cents: number): number => cents / 100;

export const toUser = (user: UserDto): User => ({
  id: user.id,
  name: user.fullName,
  email: user.email,
  ...(user.nif ? { nif: user.nif } : {}),
  role: user.role,
  balance: toKwanzas(user.balanceCents),
});

export const toService = (service: ServiceDto): Service => ({
  id: service.id,
  title: service.name,
  description: service.description,
  price: toKwanzas(service.priceCents),
  category: categoryLabel(service.category),
  providerId: service.providerId,
  // A API não devolve o nome do prestador nos serviços.
  providerName: "Prestador",
  ...(service.imageUrl ? { imageUrl: service.imageUrl } : {}),
});

// O corpo para criar ou editar um serviço. `imageUrl`: um endereço põe ou muda a imagem,
// `null` tira-a e ausente deixa-a como está.
export interface ServiceBody {
  name: string;
  description: string;
  priceCents: number;
  category: CategoryCode;
  imageUrl?: string | null;
}

export const toServiceBody = ({
  title,
  description,
  price,
  category,
  imageUrl,
}: ServiceInput): ServiceBody => ({
  name: title.trim(),
  description: description.trim(),
  priceCents: toCents(price),
  category: categoryCode(category),
  ...(imageUrl !== undefined && { imageUrl }),
});

// Uma contratação é a transação que o histórico mostra.
export const toTransaction = (booking: BookingDto): Transaction => ({
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

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};
export const statusLabel = (status: BookingStatus): string =>
  STATUS_LABELS[status] ?? status;
