import { expect, type Locator, type Page } from "@playwright/test";

/** Abre uma página do menu lateral. */
export const openPage = async (page: Page, name: string | RegExp): Promise<void> => {
  await page.goto("/app");
  await page.locator("nav .nav-item").filter({ hasText: name }).click();
};

/** Muda de página sem recarregar (para não perder o estado). */
export const goTo = async (page: Page, name: string | RegExp): Promise<void> => {
  await page.locator("nav .nav-item").filter({ hasText: name }).click();
};

/** "15 000,00 Kz" passa a 15000. */
export const parseKz = (text: string | null): number =>
  Number((text ?? "").replace(/[^\d,]/g, "").replace(",", "."));

/** O saldo mostrado na carteira, em Kwanzas. */
export const walletBalance = async (page: Page): Promise<number> => {
  const balance = page.locator(".balance-card-large strong");
  await expect(balance).toBeVisible();
  return parseKz(await balance.textContent());
};

/** A linha do histórico de um serviço. */
export const historyRow = (page: Page, serviceTitle: string): Locator =>
  page.locator("tbody tr").filter({ hasText: serviceTitle });

/** Procura um serviço no catálogo do cliente e abre o seu detalhe. */
export const openServiceDetail = async (page: Page, title: string): Promise<void> => {
  await goTo(page, "Explorar serviços");
  await page.getByPlaceholder("Pesquisar serviços").fill(title);
  await page.locator("button.service-card-button").filter({ hasText: title }).click();
};
