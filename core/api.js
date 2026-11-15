// Pedidos à API do desafio 1.
//
// O navegador só fala com este site: o Next reencaminha /v1/* para a API (next.config.mjs). A sessão
// vai em cookies httpOnly, que a API põe e que o JavaScript nunca lê, por isso não há token aqui.
const BASE = "/v1";

// A API alojada na Render grátis adormece e a primeira resposta pode levar quase um minuto.
// Sem limite, um servidor que não responde deixava o ecrã a carregar para sempre.
const TIMEOUT_MS = 60_000;
const PAGE_SIZE = 100;

export const UNAUTHORIZED_EVENT = "bulir:unauthorized";

export class ApiError extends Error {
  constructor(message, status, body = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    // O corpo da resposta de erro: um pagamento recusado (402) traz aqui o pagamento e a razão.
    this.body = body;
  }
}

const messageFor = (status, body) => {
  const message = body?.message;
  if (Array.isArray(message) && message[0]) return message[0];
  if (status === 429)
    return "Demasiadas tentativas. Aguarde um minuto e tente outra vez.";
  if (typeof message === "string" && message && !message.includes("Exception"))
    return message;
  return "Não foi possível concluir a operação.";
};

// Renova a sessão com o cookie de refresh. O refresh token roda a cada uso, por isso só pode haver
// uma renovação de cada vez: dois pedidos em paralelo revogariam a sessão.
let refreshing = null;
const refreshSession = () => {
  if (!refreshing) {
    // Com o mesmo limite dos outros pedidos: um servidor a acordar não pode prender todos à espera.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    refreshing = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      signal: controller.signal,
    })
      .then(
        (response) => response.ok,
        () => false,
      )
      .finally(() => {
        clearTimeout(timer);
        refreshing = null;
      });
  }
  return refreshing;
};

// Estes pedidos não se repetem depois de renovar a sessão: um 401 aqui é a resposta certa.
const WITHOUT_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

export const api = async (path, { retry = true, ...options } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      error.name === "AbortError"
        ? "O servidor demorou demasiado a responder. Tente outra vez."
        : "Sem ligação ao servidor. Verifique a rede.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 && !WITHOUT_REFRESH.includes(path)) {
    // A sessão pode ter só o token de acesso caducado: renova-se e repete-se o pedido uma vez.
    if (retry && (await refreshSession()))
      return api(path, { ...options, retry: false });
    // Sem renovação, ou com o pedido repetido a falhar na mesma: a sessão acabou.
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(messageFor(response.status, body), response.status, body);
  }
  return response.status === 204 ? null : response.json();
};

export const json = (method, body) => ({
  method,
  body: JSON.stringify(body),
});

// As listas da API vêm paginadas (até 100 por página): junta todas as páginas.
export const allPages = async (path, params = {}) => {
  const items = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ ...params, page, pageSize: PAGE_SIZE });
    const data = await api(`${path}?${query}`);
    items.push(...data.items);
    if (items.length >= data.total || data.items.length === 0) return items;
  }
};

// As imagens dos serviços estão no Cloudinary e já trazem o endereço completo (https).
export const assetUrl = (url) => (url?.startsWith("https://") ? url : "");
