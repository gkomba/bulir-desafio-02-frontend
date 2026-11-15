// Contratações (reservas) na API do desafio 1.
import { api, json } from "./api.ts";
import { toTransaction } from "./adapters.ts";
import type { BookingDto, Transaction } from "../types/domain.ts";

/** A parte da API `crypto` de que a chave precisa (para se poder testar sem `randomUUID`). */
export interface KeySource {
  randomUUID?: () => string;
  getRandomValues: (array: Uint8Array<ArrayBuffer>) => unknown;
}

// A API pede uma Idempotency-Key: repetir o pedido com a mesma chave (por exemplo, com a rede a
// falhar a meio) devolve a mesma reserva em vez de cobrar duas vezes. Uma chave nova por tentativa
// de contratação, que se mantém enquanto a tentativa não correr bem.
// `crypto.randomUUID` só existe em contextos seguros (https ou localhost): noutros, gera-se uma
// chave de 32 caracteres hexadecimais com `getRandomValues`, que existe sempre.
export const newIdempotencyKey = (
  source: KeySource = globalThis.crypto,
): string => {
  if (typeof source.randomUUID === "function") return source.randomUUID();
  const bytes = new Uint8Array(16);
  source.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const placeBooking = (
  serviceId: string,
  scheduledAt: Date,
  idempotencyKey: string,
): Promise<Transaction> =>
  api<BookingDto>("/bookings", {
    ...json("POST", { serviceId, scheduledAt: scheduledAt.toISOString() }),
    headers: { "Idempotency-Key": idempotencyKey },
  }).then(toTransaction);

// O cliente cancela (o valor volta-lhe) e o prestador conclui.
export const cancelBooking = (id: string): Promise<Transaction> =>
  api<BookingDto>(`/bookings/${id}/cancel`, { method: "POST" }).then(toTransaction);

export const completeBooking = (id: string): Promise<Transaction> =>
  api<BookingDto>(`/bookings/${id}/complete`, { method: "POST" }).then(toTransaction);

export const toLocalInput = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// A data por defeito de uma contratação: amanhã às 09:00, no formato do campo de data e hora
// (hora local, sem fuso).
export const defaultSchedule = (now: Date = new Date()): string => {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return toLocalInput(next);
};
