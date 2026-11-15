// Contratações (reservas) na API do desafio 1.
import { api, json } from "./api.js";
import { toTransaction } from "./adapters.js";

// A API pede uma Idempotency-Key: repetir o pedido com a mesma chave (por exemplo, com a rede a
// falhar a meio) devolve a mesma reserva em vez de cobrar duas vezes. Uma chave nova por tentativa
// de contratação, que se mantém enquanto a tentativa não correr bem.
// `crypto.randomUUID` só existe em contextos seguros (https ou localhost): noutros, gera-se uma
// chave de 32 caracteres hexadecimais com `getRandomValues`, que existe sempre.
export const newIdempotencyKey = (cryptoApi = globalThis.crypto) => {
  if (typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const placeBooking = (serviceId, scheduledAt, idempotencyKey) =>
  api("/bookings", {
    ...json("POST", { serviceId, scheduledAt: scheduledAt.toISOString() }),
    headers: { "Idempotency-Key": idempotencyKey },
  }).then(toTransaction);

// O cliente cancela (o valor volta-lhe) e o prestador conclui.
export const cancelBooking = (id) =>
  api(`/bookings/${id}/cancel`, { method: "POST" }).then(toTransaction);

export const completeBooking = (id) =>
  api(`/bookings/${id}/complete`, { method: "POST" }).then(toTransaction);

// A data por defeito de uma contratação: amanhã às 09:00, no formato do campo de data e hora
// (hora local, sem fuso).
export const defaultSchedule = (now = new Date()) => {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return toLocalInput(next);
};

export const toLocalInput = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
