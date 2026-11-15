import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCloudinaryUrl, optimizedUrl, srcSet, WIDTH_STEPS } from "./cloudinary.ts";

const BASE = "https://res.cloudinary.com/dp5ja9xrl/image/upload";
const URL = `${BASE}/v1700000000/bulir/services/abc123.jpg`;

describe("optimizedUrl", () => {
  it("pede a largura, com qualidade e formato automáticos, sem recortar", () => {
    assert.equal(optimizedUrl(URL, 480), `${BASE}/c_limit,w_480,q_auto,f_auto/v1700000000/bulir/services/abc123.jpg`);
  });

  it("o resto do endereço (versão, pasta e nome) não muda", () => {
    assert.match(optimizedUrl(URL, 320), /\/v1700000000\/bulir\/services\/abc123\.jpg$/);
  });

  for (const other of [
    "https://evil.com/dp5ja9xrl/image/upload/v1/bulir/services/a.jpg",
    "http://res.cloudinary.com/dp5ja9xrl/image/upload/v1/bulir/services/a.jpg",
    "https://exemplo.com/a.jpg",
    "",
  ]) {
    it(`um endereço que não é do Cloudinary segue como está: ${JSON.stringify(other)}`, () => {
      assert.equal(optimizedUrl(other, 480), other);
    });
  }
});

describe("srcSet", () => {
  it("lista os escalões, do mais pequeno para o maior, com o descritor w", () => {
    const set = srcSet(URL);
    assert.ok(set);
    assert.equal(set.split(", ").length, WIDTH_STEPS.length);
    assert.ok(set.startsWith(`${BASE}/c_limit,w_320,q_auto,f_auto/`));
    assert.ok(set.endsWith("1440w"));
  });

  it("os escalões vão por ordem crescente", () => {
    assert.deepEqual([...WIDTH_STEPS], [...WIDTH_STEPS].sort((a, b) => a - b));
  });

  it("sem Cloudinary, não há srcset", () => {
    assert.equal(srcSet("https://exemplo.com/a.jpg"), undefined);
  });
});

describe("isCloudinaryUrl", () => {
  it("reconhece só as imagens da plataforma", () => {
    assert.equal(isCloudinaryUrl(URL), true);
    assert.equal(isCloudinaryUrl("https://res.cloudinary.com/x/video/upload/a.mp4"), false);
  });
});
