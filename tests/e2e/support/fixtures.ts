import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";
import { newAccount, register, signIn, type Account } from "./accounts";

/** Uma pessoa autenticada: a conta e o navegador onde a sessão está aberta. */
export interface Session {
  account: Account;
  context: BrowserContext;
  page: Page;
}

interface WorkerFixtures {
  client: Session;
  provider: Session;
}

// Um cliente e um prestador por execução, criados e autenticados uma só vez (por API), para os
// testes não gastarem o limite de logins da API. Cada teste cria os seus próprios serviços.
export const test = base.extend<object, WorkerFixtures>({
  client: [
    async ({ browser }, use, workerInfo) => {
      const context = await browser.newContext({ baseURL: workerInfo.project.use.baseURL });
      const account = newAccount("CLIENT");
      await register(context.request, account);
      await signIn(context.request, account);
      await use({ account, context, page: await context.newPage() });
      await context.close();
    },
    { scope: "worker", timeout: 240_000 },
  ],
  provider: [
    async ({ browser }, use, workerInfo) => {
      const context = await browser.newContext({ baseURL: workerInfo.project.use.baseURL });
      const account = newAccount("PROVIDER");
      await register(context.request, account);
      await signIn(context.request, account);
      await use({ account, context, page: await context.newPage() });
      await context.close();
    },
    { scope: "worker", timeout: 240_000 },
  ],
});

export { expect };

/** Um nome de serviço único, para cada teste encontrar só o seu. */
export const uniqueName = (prefix: string): string =>
  `${prefix} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
