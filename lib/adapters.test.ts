import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categoryCode,
  categoryLabel,
  toCents,
  toService,
  toServiceBody,
  toTransaction,
  toUser,
} from "./adapters.ts";
import type { BookingDto, ServiceInput } from "../types/domain.ts";

describe("categorias", () => {
  it("cada código da API tem o seu nome e volta ao mesmo código", () => {
    for (const code of ["HOME", "BEAUTY", "TECHNOLOGY", "EDUCATION", "HEALTH", "EVENTS", "AUTOMOTIVE", "OTHER"]) {
      assert.equal(categoryCode(categoryLabel(code)), code);
    }
  });

  it("um nome desconhecido ou em falta cai em Outros", () => {
    assert.equal(categoryLabel(undefined), "Outros");
    assert.equal(categoryCode("Inventada"), "OTHER");
  });
});

describe("dinheiro: Kwanzas no painel, cêntimos na API", () => {
  it("converte e arredonda sem erros de vírgula flutuante", () => {
    assert.equal(toCents(150.5), 15050);
    assert.equal(toCents("8000"), 800000);
    assert.equal(toCents(0.07), 7);
    assert.equal(toCents(19.99), 1999);
  });
});

describe("toServiceBody", () => {
  const base: ServiceInput = { title: "  Canalização ", description: " Fugas ", price: 150.5, category: "Casa" };

  it("monta o corpo da API com o texto aparado", () => {
    assert.deepEqual(toServiceBody(base), {
      name: "Canalização",
      description: "Fugas",
      priceCents: 15050,
      category: "HOME",
    });
  });

  it("sem imageUrl, deixa a imagem como está (a chave não vai)", () => {
    assert.equal("imageUrl" in toServiceBody(base), false);
  });

  it("com um endereço põe a imagem e com null tira-a", () => {
    assert.equal(toServiceBody({ ...base, imageUrl: "https://x/y.jpg" }).imageUrl, "https://x/y.jpg");
    assert.equal(toServiceBody({ ...base, imageUrl: null }).imageUrl, null);
  });
});

describe("dados da API para o painel", () => {
  it("serviço: preço em Kwanzas, categoria por extenso e imagem opcional", () => {
    const service = toService({ id: "s1", providerId: "p1", name: "Pintura", description: "d", priceCents: 123456, category: "HOME", imageUrl: null });
    assert.equal(service.title, "Pintura");
    assert.equal(service.price, 1234.56);
    assert.equal(service.category, "Casa");
    assert.equal(service.imageUrl, undefined);
  });

  it("utilizador: nome, NIF opcional e saldo em Kwanzas", () => {
    const user = toUser({ id: "u1", fullName: "Ana", email: "a@b.c", nif: null, role: "CLIENT", balanceCents: 5000 });
    assert.deepEqual([user.name, user.nif, user.balance], ["Ana", undefined, 50]);
  });

  it("reserva: vira uma transação com o valor em Kwanzas", () => {
    const booking: BookingDto = { id: "b1", serviceId: "s1", serviceName: "Pintura", providerId: "p", providerName: "Rui", clientId: "c", clientName: "Ana", priceCents: 250000, status: "CONFIRMED", scheduledAt: "2026-12-01T10:00:00Z", createdAt: "2026-11-15T10:00:00Z" };
    const tx = toTransaction(booking);
    assert.equal(tx.serviceTitle, "Pintura");
    assert.equal(tx.amount, 2500);
  });
});
