import { createServiceByApi, newAccount, register, signIn } from "./support/accounts";
import { expect, test, uniqueName } from "./support/fixtures";
import { goTo, openPage } from "./support/ui";

test.describe("o que cada perfil vê", () => {
  test("o cliente vê o catálogo e a carteira com saldo, e não vê 'Os meus serviços'", async ({ client }) => {
    const { page } = client;
    await page.goto("/app");

    await expect(page.locator("nav .nav-item")).toContainText([
      "Início",
      "Explorar serviços",
      "Carteira",
      "Histórico",
      "Perfil",
      "Definições",
    ]);
    await expect(page.locator("nav .nav-item").filter({ hasText: "Os meus serviços" })).toHaveCount(0);
    // Não há notificações: o backend não as tem
    await expect(page.getByRole("button", { name: /Notificações/ })).toHaveCount(0);
  });

  test("o prestador vê os seus serviços e uma carteira só de consulta (sem levantamentos)", async ({ provider }) => {
    const { page } = provider;
    await page.goto("/app");

    await expect(page.locator("nav .nav-item")).toContainText([
      "Visão geral",
      "Os meus serviços",
      "Carteira",
      "Histórico",
      "Perfil",
      "Definições",
    ]);
    await goTo(page, "Carteira");
    await expect(page.getByText("Como recebe")).toBeVisible();
    await expect(page.getByRole("button", { name: /Adicionar saldo|levantamento/i })).toHaveCount(0);
  });

  test("o cliente vê os serviços de todos os prestadores e só ele os contrata", async ({ client, provider, browser, baseURL }) => {
    const mine = uniqueName("Serviço do prestador A");
    await createServiceByApi(provider.context.request, { name: mine, priceCents: 150000 });

    // Um segundo prestador, com o seu serviço
    const otherContext = await browser.newContext({ baseURL });
    const other = newAccount("PROVIDER");
    await register(otherContext.request, other);
    await signIn(otherContext.request, other);
    const theirs = uniqueName("Serviço do prestador B");
    await createServiceByApi(otherContext.request, { name: theirs, priceCents: 250000 });
    await otherContext.close();

    // O cliente vê os dois no catálogo
    await client.page.goto("/app");
    await goTo(client.page, "Explorar serviços");
    await client.page.getByPlaceholder("Pesquisar serviços").fill("Serviço do prestador");
    await expect(client.page.locator("button.service-card-button").filter({ hasText: mine })).toHaveCount(1);
    await expect(client.page.locator("button.service-card-button").filter({ hasText: theirs })).toHaveCount(1);

    // O prestador A só vê o seu, e no detalhe não há botão de contratar
    await openPage(provider.page, "Os meus serviços");
    await expect(provider.page.locator("article.service-card").filter({ hasText: mine })).toHaveCount(1);
    await expect(provider.page.locator("article.service-card").filter({ hasText: theirs })).toHaveCount(0);
    await provider.page.locator("article.service-card").filter({ hasText: mine }).locator("button.service-card-button").click();
    await expect(provider.page.getByRole("button", { name: /Contratar serviço/ })).toHaveCount(0);
  });

  test("o catálogo pesquisa, filtra por categoria e ordena por preço", async ({ client, provider }) => {
    const tag = uniqueName("Catálogo");
    const cheap = `${tag} barato`;
    const dear = `${tag} caro`;
    const beauty = `${tag} beleza`;
    await createServiceByApi(provider.context.request, { name: dear, priceCents: 900000 });
    await createServiceByApi(provider.context.request, { name: cheap, priceCents: 100000 });
    await createServiceByApi(provider.context.request, { name: beauty, priceCents: 500000, category: "BEAUTY" });

    const { page } = client;
    await page.goto("/app");
    await goTo(page, "Explorar serviços");
    await page.getByPlaceholder("Pesquisar serviços").fill(tag);
    await expect(page.locator("button.service-card-button")).toHaveCount(3);

    // Categoria
    await page.locator(".category-row").getByRole("button", { name: "Beleza" }).click();
    await expect(page.locator("button.service-card-button")).toHaveCount(1);
    await expect(page.locator("button.service-card-button")).toContainText(beauty);
    await page.locator(".category-row").getByRole("button", { name: "Todos" }).click();

    // Ordem por preço
    await page.getByRole("button", { name: /Ordenar por/ }).click();
    await page.getByRole("menuitemradio", { name: "Menor preço" }).click();
    await expect(page.locator("button.service-card-button h3").first()).toHaveText(cheap);
    await page.getByRole("button", { name: /Ordenar por/ }).click();
    await page.getByRole("menuitemradio", { name: "Maior preço" }).click();
    await expect(page.locator("button.service-card-button h3").first()).toHaveText(dear);

    // Sem resultados
    await page.getByPlaceholder("Pesquisar serviços").fill("zzz-nada-assim-existe");
    await expect(page.getByText("Não encontrámos serviços")).toBeVisible();
  });

  test("o perfil e as definições mostram os dados da conta, só de leitura", async ({ provider }) => {
    const { page, account } = provider;
    await openPage(page, "Perfil");
    await expect(page.locator(".profile-info")).toContainText(account.name);
    await expect(page.locator(".profile-info")).toContainText(account.email);
    await expect(page.locator(".profile-info")).toContainText(account.nif as string);

    await goTo(page, "Definições");
    await expect(page.locator(".settings-details")).toContainText(account.name);
    // O backend não permite alterar o perfil nem a palavra-passe
    await expect(page.getByText("Telefone")).toHaveCount(0);
    await expect(page.getByText("Alterar palavra-passe")).toHaveCount(0);
  });

  test("guarda e remove cartões nas definições (só os últimos 4 dígitos)", async ({ client }) => {
    const { page } = client;
    await openPage(page, "Definições");
    await page.getByLabel("Nome do titular").fill("Ana Cliente");
    await page.getByLabel("Número do cartão").fill("4111 1111 1111 4242");
    await page.getByLabel("Validade (MM/AA)").fill("12/30");
    await page.getByRole("button", { name: "Adicionar cartão" }).click();

    await expect(page.getByText("Visa •••• 4242")).toBeVisible();
    await expect(page.locator(".default-card-label")).toHaveText("Predefinido");
    // Só se guardam a marca e os últimos 4 dígitos
    const stored = await page.evaluate(() => JSON.stringify({ ...window.localStorage }));
    expect(stored).not.toContain("4111");

    await page.getByRole("button", { name: "Remover" }).first().click();
    await expect(page.getByText("Visa •••• 4242")).toHaveCount(0);
  });
});
