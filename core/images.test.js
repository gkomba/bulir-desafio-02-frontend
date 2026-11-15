import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitWithin, SIDES, uploadErrorMessage } from "./images.js";

describe("fitWithin: reduzir o lado maior, sem nunca ampliar", () => {
  it("uma imagem larga reduz a largura e mantém a proporção", () => {
    assert.deepEqual(fitWithin(4000, 3000, 1280), { width: 1280, height: 960 });
  });

  it("uma imagem alta reduz a altura", () => {
    assert.deepEqual(fitWithin(3000, 4000, 1280), { width: 960, height: 1280 });
  });

  it("uma quadrada fica quadrada", () => {
    assert.deepEqual(fitWithin(3000, 3000, 1280), { width: 1280, height: 1280 });
  });

  it("uma imagem que já cabe não se mexe", () => {
    assert.deepEqual(fitWithin(800, 600, 1280), { width: 800, height: 600 });
    assert.deepEqual(fitWithin(1280, 1280, 1280), { width: 1280, height: 1280 });
  });

  it("um píxel acima do limite já reduz", () => {
    assert.notDeepEqual(fitWithin(1281, 100, 1280), { width: 1281, height: 100 });
  });

  it("nunca dá uma dimensão de zero, mesmo numa faixa muito fina", () => {
    assert.equal(fitWithin(10000, 1, 1280).height, 1);
  });

  it("as tentativas vão do maior lado para o menor", () => {
    assert.deepEqual([...SIDES], [...SIDES].sort((a, b) => b - a));
  });
});

describe("uploadErrorMessage: a recusa do Cloudinary em português", () => {
  const cases = [
    [400, "Image file format gif not allowed", /formato/],
    [400, "File size too large", /grande/],
    [401, "Invalid Signature", /expirou/],
    [429, "", /ocupado/],
    [500, "", /ocupado/],
    [418, "", /Não foi possível/],
  ];
  for (const [status, text, pattern] of cases) {
    it(`${status} "${text}"`, () => {
      assert.match(uploadErrorMessage(status, { error: { message: text } }), pattern);
    });
  }
});
