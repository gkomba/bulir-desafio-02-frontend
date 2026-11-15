"use client";

import { useEffect, useState } from "react";

// Os cartões guardados são só uma escolha na interface (o carregamento de saldo é um pagamento
// simulado pela API). Guardam-se no navegador, por pessoa, e só a marca e os últimos 4 dígitos.
export interface SavedCard {
  id: string;
  brand: "Visa" | "Mastercard";
  last4: string;
  holder: string;
  expiry: string;
  isDefault: boolean;
}

const storageKey = (userId: string) => `bulir.cards.${userId}`;

const isSavedCard = (value: unknown): value is SavedCard => {
  if (typeof value !== "object" || value === null) return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.id === "string" &&
    (card.brand === "Visa" || card.brand === "Mastercard") &&
    typeof card.last4 === "string" &&
    typeof card.holder === "string" &&
    typeof card.expiry === "string" &&
    typeof card.isDefault === "boolean"
  );
};

const read = (userId: string): SavedCard[] => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey(userId)) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isSavedCard) : [];
  } catch {
    // Dados locais inválidos ignoram-se: ficam os cartões vazios.
    return [];
  }
};

export function useCards(userId: string) {
  const [cards, setCards] = useState<SavedCard[]>(() => read(userId));

  useEffect(() => {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(cards));
  }, [userId, cards]);

  return { cards, setCards };
}
