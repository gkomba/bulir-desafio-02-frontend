import { expect, test } from "./support/fixtures";

test.describe("páginas públicas", () => {
  test("a página inicial apresenta a Bulir e leva à entrada e ao registo", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Bulir/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Encontre quem resolve");
    await expect(page.getByRole("link", { name: "Entrar" }).first()).toHaveAttribute("href", "/app");
    await expect(page.getByRole("link", { name: "Criar conta" }).first()).toHaveAttribute(
      "href",
      "/app?mode=register&role=CLIENT",
    );
  });

  test("a página do prestador leva ao registo de prestadores", async ({ page }) => {
    await page.goto("/prestador");
    await expect(page).toHaveTitle(/prestadores/);
    await expect(page.getByRole("link", { name: "Criar conta" }).first()).toHaveAttribute(
      "href",
      "/app?mode=register&role=PROVIDER",
    );
  });

  test("a página do cliente e a do prestador ligam-se entre si", async ({ page }) => {
    await page.goto("/cliente");
    await page.getByRole("link", { name: "Quero prestar serviços" }).click();
    await expect(page).toHaveURL(/\/prestador$/);
  });

  test("sem sessão, a área da aplicação mostra a entrada", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: "Entre na sua conta" })).toBeVisible();
  });
});
