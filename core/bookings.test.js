import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultSchedule, newIdempotencyKey, toLocalInput } from "./bookings.js";
import { statusLabel, toTransaction } from "./adapters.js";

describe("defaultSchedule: amanhã às 09:00, no formato do campo de data e hora", () => {
  it("dá o dia seguinte às 09:00", () => {
    assert.equal(defaultSchedule(new Date(2026, 10, 15, 22, 30)), "2026-11-16T09:00");
  });

  it("passa corretamente ao mês e ao ano seguintes", () => {
    assert.equal(defaultSchedule(new Date(2026, 11, 31, 23, 59)), "2027-01-01T09:00");
  });

  it("sempre no futuro", () => {
    assert.ok(new Date(defaultSchedule(new Date())) > new Date());
  });
});

describe("toLocalInput", () => {
  it("completa os números com zeros", () => {
    assert.equal(toLocalInput(new Date(2026, 0, 5, 7, 4)), "2026-01-05T07:04");
  });
});

describe("Idempotency-Key", () => {
  it("cumpre o formato da API: 1 a 64 letras, números, - ou _", () => {
    const key = newIdempotencyKey();
    assert.match(key, /^[A-Za-z0-9_-]{1,64}$/);
  });

  it("cada tentativa tem a sua chave", () => {
    assert.notEqual(newIdempotencyKey(), newIdempotencyKey());
  });
});

describe("estado das contratações", () => {
  const cases = [
    ["CONFIRMED", "Confirmada"],
    ["COMPLETED", "Concluída"],
    ["CANCELLED", "Cancelada"],
  ];
  for (const [status, label] of cases) {
    it(`${status} lê-se "${label}"`, () => assert.equal(statusLabel(status), label));
  }

  it("a transação traz a data marcada e o estado", () => {
    const tx = toTransaction({ id: "b", serviceName: "S", providerId: "p", providerName: "P", clientId: "c", clientName: "C", priceCents: 100, status: "CONFIRMED", scheduledAt: "2026-12-01T10:00:00Z", createdAt: "2026-11-15T10:00:00Z" });
    assert.equal(tx.scheduledAt, "2026-12-01T10:00:00Z");
    assert.equal(tx.status, "CONFIRMED");
  });
});
