import type { Page } from "@playwright/test";
import { createServiceByApi } from "./support/accounts";
import { expect, test, uniqueName, type Session } from "./support/fixtures";
import { goTo, historyRow, openPage, openServiceDetail, walletBalance } from "./support/ui";

// O cliente carrega saldo pela carteira.
const addFunds = async (page: Page, kwanzas: number) => {
  await goTo(page, "Carteira");
  await page.locator('input[name="amount"]').fill(String(kwanzas));
  await page.getByRole("button", { name: "Adicionar saldo" }).last().click();
  await expect(page.getByText("Saldo adicionado.")).toBeVisible();
};

// O cliente contrata o serviço (com a data por defeito: amanhã às 09:00).
const hire = async (page: Page, title: string) => {
  await openServiceDetail(page, title);
  await page.getByRole("button", { name: /Contratar serviço/ }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByText("Serviço contratado com sucesso.")).toBeVisible();
};

// Um serviço novo, criado pelo prestador por API, para cada teste ter o seu.
const publish = async (provider: Session, prefix: string, priceKz: number): Promise<string> => {
  const title = uniqueName(prefix);
  await createServiceByApi(provider.context.request, { name: title, priceCents: priceKz * 100 });
  return title;
};

test.describe("contratação, carteira e histórico", () => {
  test("o cliente carrega saldo, contrata e vê a contratação no histórico", async ({ client, provider }) => {
    const { page } = client;
    const title = await publish(provider, "Pintura", 5000);
    await page.goto("/app");

    await addFunds(page, 20000);
    const before = await walletBalance(page);

    await hire(page, title);
    // O saldo desce o preço do serviço
    await goTo(page, "Carteira");
    expect(await walletBalance(page)).toBe(before - 5000);

    // O histórico mostra o serviço, o cliente, o prestador, o valor e o estado
    await goTo(page, "Histórico");
    const row = historyRow(page, title);
    await expect(row).toBeVisible();
    await expect(row).toContainText(client.account.name);
    await expect(row).toContainText(provider.account.name);
    await expect(row).toContainText("Confirmada");
    await expect(row).toContainText(/5[\s ]?000,00/);
  });

  test("cancelar uma contratação devolve o valor ao cliente", async ({ client, provider }) => {
    const { page } = client;
    const title = await publish(provider, "Limpeza", 4000);
    await page.goto("/app");
    await addFunds(page, 10000);
    const before = await walletBalance(page);
    await hire(page, title);

    await goTo(page, "Histórico");
    await historyRow(page, title).getByRole("button", { name: `Cancelar ${title}` }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Cancelar a contratação?");
    await dialog.getByRole("button", { name: "Cancelar contratação" }).click();

    await expect(page.getByText("Contratação cancelada.")).toBeVisible();
    await expect(historyRow(page, title)).toContainText("Cancelada");
    await goTo(page, "Carteira");
    expect(await walletBalance(page)).toBe(before);
  });

  test("o prestador recebe o valor e conclui a contratação", async ({ client, provider }) => {
    const title = await publish(provider, "Jardinagem", 6000);
    await openPage(provider.page, "Carteira");
    const providerBefore = await walletBalance(provider.page);

    await client.page.goto("/app");
    await addFunds(client.page, 10000);
    await hire(client.page, title);

    // O valor entra logo no saldo do prestador
    await openPage(provider.page, "Carteira");
    expect(await walletBalance(provider.page)).toBe(providerBefore + 6000);

    // O prestador conclui a contratação
    await goTo(provider.page, "Histórico");
    const row = historyRow(provider.page, title);
    await expect(row).toContainText("Confirmada");
    await row.getByRole("button", { name: `Concluir ${title}` }).click();
    await expect(provider.page.getByText("Serviço concluído.")).toBeVisible();
    await expect(historyRow(provider.page, title)).toContainText("Concluída");
    // Concluída já não se pode cancelar nem concluir outra vez
    await expect(historyRow(provider.page, title).getByRole("button")).toHaveCount(0);
  });

  test("sem saldo suficiente não se pode contratar", async ({ client, provider }) => {
    const { page } = client;
    const title = await publish(provider, "Obra cara", 9_000_000);
    await page.goto("/app");

    await openServiceDetail(page, title);
    await page.getByRole("button", { name: /Contratar serviço/ }).click();
    await expect(page.getByText("O saldo da carteira não é suficiente")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirmar", exact: true })).toBeDisabled();
  });

  test("uma data no passado é recusada antes de chamar a API", async ({ client, provider }) => {
    const { page } = client;
    const title = await publish(provider, "Data passada", 1000);
    await page.goto("/app");
    await addFunds(page, 5000);

    await openServiceDetail(page, title);
    await page.getByRole("button", { name: /Contratar serviço/ }).click();
    await page.locator('input[type="datetime-local"]').fill("2020-01-01T09:00");
    await page.getByRole("button", { name: "Confirmar", exact: true }).click();
    await expect(page.locator(".hire-error")).toHaveText("Escolha uma data e uma hora no futuro.");

    await page.getByRole("button", { name: "Cancelar" }).click();
    // Fecha também o detalhe do serviço, que continua aberto por baixo
    await page.getByRole("button", { name: "Fechar" }).click();
    await goTo(page, "Histórico");
    await expect(historyRow(page, title)).toHaveCount(0);
  });

  test("o limite de um carregamento é de 1 000 000 Kz", async ({ client }) => {
    const { page } = client;
    await page.goto("/app");
    await goTo(page, "Carteira");
    const amount = page.locator('input[name="amount"]');
    await amount.fill("2000000");
    await expect(amount).toHaveJSProperty("validity.rangeOverflow", true);
    await amount.fill("1000000");
    await expect(amount).toHaveJSProperty("validity.valid", true);
    await amount.fill("0");
    await expect(amount).toHaveJSProperty("validity.rangeUnderflow", true);
  });

  test("os atalhos de valor preenchem o campo", async ({ client }) => {
    const { page } = client;
    await page.goto("/app");
    await goTo(page, "Carteira");
    await page.getByRole("button", { name: "25 mil" }).click();
    await expect(page.locator('input[name="amount"]')).toHaveValue("25000");
  });
});
