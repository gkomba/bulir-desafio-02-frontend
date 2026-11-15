// Serviços na API do desafio 1. Os dados entram e saem no formato do painel (ver adapters.ts).
import { api, json } from "./api.ts";
import { toService, toServiceBody } from "./adapters.ts";
import type {
  Service,
  ServiceDto,
  ServiceInput,
  UploadAuthorization,
} from "../types/domain.ts";

export const createService = (data: ServiceInput): Promise<Service> =>
  api<ServiceDto>("/services", json("POST", toServiceBody(data))).then(toService);

export const updateService = (id: string, data: ServiceInput): Promise<Service> =>
  api<ServiceDto>(`/services/${id}`, json("PATCH", toServiceBody(data))).then(
    toService,
  );

export const removeService = (id: string): Promise<null> =>
  api<null>(`/services/${id}`, { method: "DELETE" });

// A autorização, assinada pela API, para enviar uma imagem diretamente ao Cloudinary.
export const imageAuthorization = (): Promise<UploadAuthorization> =>
  api<UploadAuthorization>("/services/image-signature", { method: "POST" });
