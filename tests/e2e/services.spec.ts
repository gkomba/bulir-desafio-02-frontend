import type { Locator, Page } from "@playwright/test";
import { noisyPhoto, transparentPng } from "./support/images";
import { expect, test, uniqueName } from "./support/fixtures";

const openServices = async (page: Page) => {
  await page.goto("/app");
  await page.locator("nav .nav-item").filter({ hasText: "Os meus serviços" }).click();
  await expect(page.getByRole("heading", { name: "Os meus serviços" })).toBeVisible();
};

interface ServiceFields {
  title: string;
  description?: string;
  price: string;
  category?: string;
}

const fillService = async (page: Page, fields: ServiceFields) => {
  await page.getByPlaceholder("Ex.: Canalização residencial").fill(fields.title);
  await page
    .getByPlaceholder("Descreva o serviço que oferece")
    .fill(fields.description ?? "Descrição do serviço, com mais de dez caracteres.");
  await page.getByPlaceholder("Ex.: 8 000").fill(fields.price);
  if (fields.category) {
    await page.getByRole("button", { name: /Categoria:/ }).click();
    await page.getByRole("menuitemradio", { name: fields.category }).click();
  }
};

const card = (page: Page, title: string): Locator =>
  page.locator("article.service-card").filter({ hasText: title });

test.describe("serviços do prestador", () => {
  test("publica um serviço e vê-o na sua lista, com preço e categoria", async ({ provider }) => {
    const { page } = provider;
    const title = uniqueName("Canalização");
    await openServices(page);

    await fillService(page, { title, price: "8500.50", category: "Beleza" });
    await page.getByRole("button", { name: /Publicar serviço/ }).click();

    await expect(page.getByText("Serviço publicado.")).toBeVisible();
    const created = card(page, title);
    await expect(created).toBeVisible();
    await expect(created).toContainText("Beleza");
    await expect(created).toContainText(/8[\s ]?500,50/);
    // O formulário volta ao estado de criar, vazio
    await expect(page.getByPlaceholder("Ex.: Canalização residencial")).toHaveValue("");
  });

  test("edita o título e o preço, e pode cancelar a edição", async ({ provider }) => {
    const { page } = provider;
    const title = uniqueName("Pintura");
    await openServices(page);
    await fillService(page, { title, price: "5000" });
    await page.getByRole("button", { name: /Publicar serviço/ }).click();
    await expect(card(page, title)).toBeVisible();

    // Cancelar a edição limpa o formulário
    await card(page, title).getByRole("button", { name: `Editar ${title}` }).click();
    await expect(page.getByText("Atualizar serviço")).toBeVisible();
    await expect(page.getByPlaceholder("Ex.: Canalização residencial")).toHaveValue(title);
    await page.getByRole("button", { name: "Cancelar edição" }).click();
    await expect(page.getByPlaceholder("Ex.: Canalização residencial")).toHaveValue("");

    // Editar de verdade
    await card(page, title).getByRole("button", { name: `Editar ${title}` }).click();
    const novo = `${title} (editado)`;
    await page.getByPlaceholder("Ex.: Canalização residencial").fill(novo);
    await page.getByPlaceholder("Ex.: 8 000").fill("9000");
    await page.getByRole("button", { name: "Guardar alterações" }).click();

    await expect(page.getByText("Serviço atualizado.")).toBeVisible();
    await expect(card(page, novo)).toContainText(/9[\s ]?000,00/);
    await expect(card(page, `${title} (editado)`)).toHaveCount(1);
  });

  test("remover pede confirmação: cancelar mantém e confirmar remove", async ({ provider }) => {
    const { page } = provider;
    const title = uniqueName("Limpeza");
    await openServices(page);
    await fillService(page, { title, price: "3000" });
    await page.getByRole("button", { name: /Publicar serviço/ }).click();
    await expect(card(page, title)).toBeVisible();

    await card(page, title).getByRole("button", { name: `Remover ${title}` }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Remover o serviço?");
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(card(page, title)).toHaveCount(1);

    await card(page, title).getByRole("button", { name: `Remover ${title}` }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Remover" }).click();
    await expect(page.getByText("Serviço removido.")).toBeVisible();
    await expect(card(page, title)).toHaveCount(0);
  });

  test("o formulário não deixa publicar um serviço inválido", async ({ provider }) => {
    const { page } = provider;
    await openServices(page);
    await fillService(page, { title: "ab", description: "curta", price: "0" });
    await expect(page.getByPlaceholder("Ex.: Canalização residencial")).toHaveJSProperty("validity.tooShort", true);
    await expect(page.getByPlaceholder("Descreva o serviço que oferece")).toHaveJSProperty("validity.tooShort", true);
    await expect(page.getByPlaceholder("Ex.: 8 000")).toHaveJSProperty("validity.rangeUnderflow", true);
    await page.getByPlaceholder("Ex.: 8 000").fill("20000000");
    await expect(page.getByPlaceholder("Ex.: 8 000")).toHaveJSProperty("validity.rangeOverflow", true);
  });

  test("a foto é comprimida no navegador e enviada diretamente ao Cloudinary", async ({ provider }) => {
    const { page, context } = provider;
    const title = uniqueName("Com imagem");

    // O envio ao Cloudinary é simulado: o teste não deixa imagens na conta de ninguém. A
    // assinatura é pedida à API a sério, e o nome da conta vem dela.
    const signature = await context.request.post("/v1/services/image-signature");
    test.skip(signature.status() === 503, "A API não tem o Cloudinary configurado.");
    expect(signature.status()).toBe(200);
    const { uploadUrl } = (await signature.json()) as { uploadUrl: string };
    const cloud = uploadUrl.split("/")[4];

    let uploadBytes = 0;
    let uploadedTo = "";
    await page.route("https://api.cloudinary.com/**", async (route) => {
      uploadedTo = route.request().url();
      uploadBytes = route.request().postDataBuffer()?.length ?? 0;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          secure_url: `https://res.cloudinary.com/${cloud}/image/upload/v1/bulir/services/e2e-${Date.now()}.jpg`,
        }),
      });
    });

    try {
      await openServices(page);
      await fillService(page, { title, price: "7000" });
      const photo = noisyPhoto();
      expect(photo.length, "a foto de teste tem de ser pesada").toBeGreaterThan(4_000_000);
      await page.locator('input[type="file"]').setInputFiles({
        name: "foto.png",
        mimeType: "image/png",
        buffer: photo,
      });

      // Comprimida no navegador, antes de sair: de vários MB para menos de 450 KB
      const ready = page.getByText(/Pronta a enviar/);
      await expect(ready).toBeVisible();
      const kb = Number(/\((\d+) KB\)/.exec((await ready.textContent()) ?? "")?.[1]);
      expect(kb).toBeGreaterThan(0);
      expect(kb).toBeLessThanOrEqual(450);

      await page.getByRole("button", { name: /Publicar serviço/ }).click();
      await expect(page.getByText("Serviço publicado.")).toBeVisible();

      // Foi enviada ao Cloudinary (e não à API), já pequena
      expect(uploadedTo).toContain(`/v1_1/${cloud}/image/upload`);
      expect(uploadBytes).toBeGreaterThan(0);
      expect(uploadBytes).toBeLessThan(600_000);

      // O cartão pede a imagem otimizada, em vários tamanhos
      const image = card(page, title).locator("img.service-image");
      await expect(image).toHaveAttribute("src", /c_limit,w_480,q_auto,f_auto/);
      expect(((await image.getAttribute("srcset")) ?? "").split(", ")).toHaveLength(5);
    } finally {
      await page.unroute("https://api.cloudinary.com/**");
    }
  });

  test("um PNG transparente fica com fundo branco, e não preto", async ({ provider }) => {
    const { page } = provider;
    await openServices(page);
    await page.locator('input[type="file"]').setInputFiles({
      name: "transparente.png",
      mimeType: "image/png",
      buffer: transparentPng(),
    });
    await expect(page.getByText(/Pronta a enviar/)).toBeVisible();

    const pixel = await page.evaluate(async () => {
      const img = document.querySelector<HTMLImageElement>(".image-field-preview img");
      if (!img) throw new Error("sem pré-visualização");
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext("2d");
      context?.drawImage(img, 0, 0);
      return Array.from(context?.getImageData(10, 10, 1, 1).data ?? []);
    });
    expect(pixel.slice(0, 3).every((channel) => channel > 240)).toBe(true);
  });

  test("não aceita um ficheiro que não é imagem", async ({ provider }) => {
    const { page } = provider;
    await openServices(page);
    await page.locator('input[type="file"]').setInputFiles({
      name: "nota.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("isto não é uma imagem"),
    });
    await expect(page.locator(".image-field-error")).toContainText(/imagem/i);
    await expect(page.getByText(/Pronta a enviar/)).toHaveCount(0);
  });
});
