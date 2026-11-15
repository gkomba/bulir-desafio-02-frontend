import { expect, type APIRequestContext } from "@playwright/test";
import { waitForLoginSlot } from "./login-budget";

export type Role = "CLIENT" | "PROVIDER";

export interface Account {
  name: string;
  email: string;
  password: string;
  role: Role;
  nif?: string;
}

let counter = 0;

// Cada teste cria as suas contas, com dados únicos: nunca se usam contas fixas nem partilhadas.
export function newAccount(role: Role): Account {
  const unique = `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  return {
    name: `E2E ${role === "CLIENT" ? "Cliente" : "Prestador"} ${unique}`,
    email: `e2e-${unique}@teste.dev`,
    password: "Senha-Segura-123",
    role,
    ...(role === "PROVIDER" ? { nif: `E2E${unique}`.toUpperCase().slice(0, 14) } : {}),
  };
}

// Os pedidos vão ao Next, que os reencaminha para a API (o mesmo caminho que o navegador usa).
export async function register(request: APIRequestContext, account: Account): Promise<void> {
  const response = await request.post("/v1/auth/register", {
    data: {
      fullName: account.name,
      email: account.email,
      password: account.password,
      role: account.role,
      ...(account.nif ? { nif: account.nif } : {}),
    },
  });
  expect(response.status(), await response.text()).toBe(201);
}

// Entra por API: os cookies de sessão ficam no `request` (e no contexto do navegador a que pertence).
// Se a API responder 429 (por exemplo, por causa de outra execução há menos de um minuto), espera
// que a janela do limite passe e tenta outra vez.
export async function signIn(request: APIRequestContext, account: Account): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    await waitForLoginSlot();
    const response = await request.post("/v1/auth/login", {
      data: { email: account.email, password: account.password },
    });
    if (response.status() !== 429 || attempt === 3) {
      expect(response.status(), await response.text()).toBe(200);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 62_000));
  }
}

export async function createServiceByApi(
  request: APIRequestContext,
  service: { name: string; priceCents: number; category?: string },
): Promise<void> {
  const response = await request.post("/v1/services", {
    data: {
      name: service.name,
      description: "Serviço criado pelos testes de interface.",
      priceCents: service.priceCents,
      category: service.category ?? "HOME",
    },
  });
  expect(response.status(), await response.text()).toBe(201);
}
