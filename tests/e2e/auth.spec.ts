import type { Page } from "@playwright/test";
import { newAccount, register, type Account } from "./support/accounts";
import { waitForLoginSlot } from "./support/login-budget";
import { expect, test } from "./support/fixtures";

// Entra pela interface (e gasta uma vaga do limite de logins da API).
async function loginThroughUi(page: Page, identifier: string, password: string) {
  await page.goto("/app");
  await page.getByPlaceholder("nome@email.com ou NIF").fill(identifier);
  await page.getByPlaceholder("A sua palavra-passe").fill(password);
  await waitForLoginSlot();
  await page.locator("form button").filter({ hasText: "Entrar" }).click();
}

const menu = (page: Page) => page.locator("nav .nav-item");

test.describe("autenticação", () => {
  test("do ecrã de entrada volta-se à landing page", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("link", { name: "Voltar ao início" }).click();
    await expect(page).toHaveURL("/");
  });

  test("uma palavra-passe errada mostra o erro e fica na entrada", async ({ page, request }) => {
    const account = newAccount("CLIENT");
    await register(request, account);

    await loginThroughUi(page, account.email, "palavra-passe-errada");

    await expect(page.getByText("Credenciais inválidas")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Entre na sua conta" })).toBeVisible();
    await expect(menu(page)).toHaveCount(0);
  });

  test("o prestador entra com o NIF e com o e-mail, e termina a sessão", async ({ page, request }) => {
    const account = newAccount("PROVIDER");
    await register(request, account);

    // Com o NIF
    await loginThroughUi(page, account.nif as string, account.password);
    await expect(menu(page).filter({ hasText: "Os meus serviços" })).toBeVisible();

    // A sessão mantém-se ao recarregar a página (vive em cookies, não em memória)
    await page.reload();
    await expect(menu(page).filter({ hasText: "Os meus serviços" })).toBeVisible();

    // Termina a sessão: pede confirmação e volta à entrada
    await page.getByRole("button", { name: "Terminar sessão" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Terminar sessão" }).click();
    await expect(page.getByRole("heading", { name: "Entre na sua conta" })).toBeVisible();

    // Sem sessão, recarregar continua na entrada
    await page.reload();
    await expect(page.getByRole("heading", { name: "Entre na sua conta" })).toBeVisible();

    // Com o e-mail
    await loginThroughUi(page, account.email, account.password);
    await expect(menu(page).filter({ hasText: "Os meus serviços" })).toBeVisible();
  });

  test("regista um cliente e entra logo", async ({ page }) => {
    const account: Account = newAccount("CLIENT");
    await page.goto("/app?mode=register&role=CLIENT");

    await page.getByPlaceholder("O seu nome").fill(account.name);
    await page.getByPlaceholder("nome@email.com").fill(account.email);
    await page.getByPlaceholder("A sua palavra-passe").fill(account.password);
    // O cliente não tem NIF
    await expect(page.getByPlaceholder("9 a 14 letras ou números")).toHaveCount(0);
    await waitForLoginSlot();
    await page.locator("form button").filter({ hasText: "Criar conta" }).click();

    await expect(menu(page).filter({ hasText: "Explorar serviços" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Olá");
  });

  test("o registo do prestador exige o NIF, com 9 a 14 letras ou números", async ({ page }) => {
    const account = newAccount("PROVIDER");
    await page.goto("/app?mode=register&role=PROVIDER");

    await page.getByPlaceholder("O seu nome").fill(account.name);
    await page.getByPlaceholder("nome@email.com").fill(account.email);
    await page.getByPlaceholder("A sua palavra-passe").fill(account.password);

    // Um NIF curto não passa a validação do formulário: nem chega a haver pedido à API
    const nif = page.getByPlaceholder("9 a 14 letras ou números");
    await nif.fill("123");
    await expect(nif).toHaveJSProperty("validity.patternMismatch", true);

    await nif.fill(account.nif as string);
    await expect(nif).toHaveJSProperty("validity.valid", true);
    await waitForLoginSlot();
    await page.locator("form button").filter({ hasText: "Criar conta" }).click();
    await expect(menu(page).filter({ hasText: "Os meus serviços" })).toBeVisible();
  });

  test("a palavra-passe do registo tem de ter pelo menos 8 caracteres", async ({ page }) => {
    await page.goto("/app?mode=register&role=CLIENT");
    const password = page.getByPlaceholder("A sua palavra-passe");
    await password.fill("curta");
    await expect(password).toHaveJSProperty("validity.tooShort", true);
    await password.fill("Senha-Segura-123");
    await expect(password).toHaveJSProperty("validity.valid", true);
  });
});
