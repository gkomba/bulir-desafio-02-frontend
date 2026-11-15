export const money = (value = 0) =>
  `${Number(value).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;
export const date = (value) =>
  new Date(value).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
export const dateTime = (value) =>
  new Date(value).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
export const categories = [
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
