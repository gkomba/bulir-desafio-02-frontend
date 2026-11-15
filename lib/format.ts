import type { CategoryLabel } from "../types/domain.ts";

export const money = (value = 0): string =>
  `${Number(value).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;

export const date = (value: string | number | Date): string =>
  new Date(value).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const dateTime = (value: string | number | Date): string =>
  new Date(value).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** "Todos" mais as categorias dos serviços. */
export type CategoryFilter = "Todos" | CategoryLabel;

export const categories: readonly CategoryFilter[] = [
  "Todos",
  "Casa",
  "Beleza",
  "Tecnologia",
  "Educação",
  "Saúde",
  "Eventos",
  "Automóvel",
  "Outros",
];
