// Os tipos do domínio. Há dois conjuntos: o que a API devolve (`*Dto`, em cêntimos e com os nomes da
// API) e o que o painel usa (em Kwanzas, com nomes de campos mais claros). A conversão entre eles
// está em lib/adapters.ts.

export type Role = "CLIENT" | "PROVIDER";

export type CategoryCode =
  | "HOME"
  | "BEAUTY"
  | "TECHNOLOGY"
  | "EDUCATION"
  | "HEALTH"
  | "EVENTS"
  | "AUTOMOTIVE"
  | "OTHER";

export type CategoryLabel =
  | "Casa"
  | "Beleza"
  | "Tecnologia"
  | "Educação"
  | "Saúde"
  | "Eventos"
  | "Automóvel"
  | "Outros";

export type BookingStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED";

// --- O que a API devolve

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  nif: string | null;
  role: Role;
  balanceCents: number;
}

export interface ServiceDto {
  id: string;
  providerId: string;
  name: string;
  description: string;
  priceCents: number;
  category: CategoryCode;
  imageUrl: string | null;
}

export interface BookingDto {
  id: string;
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  priceCents: number;
  status: BookingStatus;
  scheduledAt: string;
  createdAt: string;
}

export interface PaymentDto {
  id: string;
  amountCents: number;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  failureReason: string | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UploadAuthorization {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
}

// --- O que o painel usa

export interface User {
  id: string;
  name: string;
  email: string;
  nif?: string;
  role: Role;
  /** Em Kwanzas. */
  balance: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  /** Em Kwanzas. */
  price: number;
  category: CategoryLabel;
  providerId: string;
  providerName: string;
  imageUrl?: string;
}

/** Uma contratação, vista como uma transação do histórico. */
export interface Transaction {
  id: string;
  serviceTitle: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  /** Em Kwanzas. */
  amount: number;
  status: BookingStatus;
  scheduledAt: string;
  createdAt: string;
}

/** Os dados de um serviço, ao criar ou editar. `imageUrl`: um endereço põe a imagem, `null` tira-a. */
export interface ServiceInput {
  title: string;
  description: string;
  price: number;
  category: CategoryLabel;
  imageUrl?: string | null;
}
