// Carregar saldo: pagamentos na API do desafio 1 (simulados, o desafio não define outra forma).
import { api, ApiError, json } from "./api.js";
import { toCents } from "./adapters.js";

// Um pagamento vai até 1 000 000 Kz (100 000 000 cêntimos) e o saldo até 50 000 000 Kz.
export const MAX_PAYMENT_KWANZAS = 1_000_000;

const REFUSED = {
  BALANCE_LIMIT_EXCEEDED: "O saldo não pode passar de 50 000 000 Kz.",
  DECLINED: "O pagamento foi recusado. Tente outra vez.",
  GATEWAY_UNAVAILABLE: "O serviço de pagamentos não está disponível. Tente mais tarde.",
};

// Com a Idempotency-Key, repetir o pedido não carrega o saldo duas vezes. Um pagamento recusado
// chega como 402 com o pagamento no corpo: traduz-se a razão para uma mensagem que se percebe.
export async function addBalance(kwanzas, idempotencyKey) {
  try {
    return await api("/payments", {
      ...json("POST", { amountCents: toCents(kwanzas), method: "CARD" }),
      headers: { "Idempotency-Key": idempotencyKey },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 402) {
      throw new ApiError(
        REFUSED[error.body?.failureReason] ?? "O pagamento foi recusado.",
        402,
        error.body,
      );
    }
    throw error;
  }
}
