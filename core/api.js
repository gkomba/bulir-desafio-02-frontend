const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
let token =
  typeof window === "undefined"
    ? null
    : window.localStorage.getItem("presta-ja.token");

export const setToken = (next) => {
  token = next;
  if (typeof window === "undefined") return;
  if (next) window.localStorage.setItem("presta-ja.token", next);
  else window.localStorage.removeItem("presta-ja.token");
};

export const api = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401) {
    setToken(null);
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("presta-ja:unauthorized"));
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Não foi possível concluir a operação.");
  }
  return response.status === 204 ? null : response.json();
};

export const json = (method, body) => ({ method, body: JSON.stringify(body) });
export const assetUrl = (path) => (path ? `${API_URL}${path}` : "");
