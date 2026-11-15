// Serviços na API do desafio 1. Os dados entram e saem no formato do painel (ver adapters.js).
import { api, json } from "./api";
import { toService, toServiceBody } from "./adapters";

export const createService = (data) =>
  api("/services", json("POST", toServiceBody(data))).then(toService);

export const updateService = (id, data) =>
  api(`/services/${id}`, json("PATCH", toServiceBody(data))).then(toService);

export const removeService = (id) =>
  api(`/services/${id}`, { method: "DELETE" });

// A autorização, assinada pela API, para enviar uma imagem diretamente ao Cloudinary.
export const imageAuthorization = () =>
  api("/services/image-signature", { method: "POST" });
