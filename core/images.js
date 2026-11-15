// Imagens dos serviços. A foto é reduzida e comprimida no navegador antes de sair, e enviada
// diretamente ao Cloudinary com a assinatura da API: o ficheiro nunca passa pelo nosso servidor.

// O lado maior, em píxeis, na primeira tentativa e nas seguintes. Nunca se amplia.
export const SIDES = [1280, 1024, 800];
// A qualidade JPEG de cada tentativa, da melhor para a pior.
export const QUALITIES = [0.8, 0.7, 0.6, 0.5, 0.4];
// O tamanho a que se quer chegar, e o máximo que ainda se envia.
export const TARGET_BYTES = 450_000;
export const MAX_UPLOAD_BYTES = 8_000_000;

// As dimensões depois de reduzir o lado maior a `maxSide`, mantendo a proporção.
export const fitWithin = (width, height, maxSide) => {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

const toBlob = (canvas, quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Não foi possível ler a imagem.")),
      "image/jpeg",
      quality,
    ),
  );

export class ImageTooLargeError extends Error {
  constructor() {
    super("A imagem é demasiado grande, mesmo depois de comprimida. Escolha outra.");
    this.name = "ImageTooLargeError";
  }
}

// Reduz e comprime em JPEG, tentando uma qualidade cada vez menor (e depois um tamanho menor)
// até caber em TARGET_BYTES. Cada tentativa parte do original, para a qualidade não se perder em
// recodificações sucessivas. O JPEG novo não leva os metadados da câmara (EXIF), por isso a
// localização onde a foto foi tirada nunca sai do computador ou do telemóvel.
export async function prepareImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Escolha um ficheiro de imagem.");
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Não foi possível ler essa imagem. Experimente JPG, PNG ou WebP.");
  }
  let best = null;
  let triedOriginalSize = false;
  try {
    for (const side of SIDES) {
      const { width, height } = fitWithin(bitmap.width, bitmap.height, side);
      const resized = width !== bitmap.width || height !== bitmap.height;
      // Uma imagem que já cabe em vários lados dá a mesma imagem: não se repete a tentativa.
      if (!resized) {
        if (triedOriginalSize) continue;
        triedOriginalSize = true;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      // O JPEG não tem transparência: sem um fundo, um PNG ou WebP transparente ficava preto.
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
      for (const quality of QUALITIES) {
        const blob = await toBlob(canvas, quality);
        if (blob.size <= TARGET_BYTES) return blob;
        if (!best || blob.size < best.size) best = blob;
      }
    }
  } finally {
    bitmap.close();
  }
  if (!best || best.size > MAX_UPLOAD_BYTES) throw new ImageTooLargeError();
  return best;
}

// Traduz a recusa do Cloudinary para uma mensagem que a pessoa percebe.
export const uploadErrorMessage = (status, body) => {
  const text = String(body?.error?.message ?? "");
  if (/format .* not allowed/i.test(text))
    return "Esse formato de imagem não é aceite. Use JPG, PNG ou WebP.";
  if (/too large/i.test(text)) return "A imagem é demasiado grande.";
  if (status === 401 || /signature|timestamp/i.test(text))
    return "O envio expirou. Tente outra vez.";
  if (status >= 500 || status === 429)
    return "O serviço de imagens está ocupado. Tente outra vez.";
  return "Não foi possível enviar a imagem.";
};

// Envia a imagem ao Cloudinary (XMLHttpRequest, porque dá o progresso) e devolve o endereço seguro.
export const uploadImage = (blob, auth, onProgress = () => {}) =>
  new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("api_key", auth.apiKey);
    form.append("timestamp", String(auth.timestamp));
    form.append("folder", auth.folder);
    form.append("allowed_formats", auth.allowedFormats);
    form.append("signature", auth.signature);
    form.append("file", blob, "servico.jpg");

    const request = new XMLHttpRequest();
    request.open("POST", auth.uploadUrl);
    request.timeout = 60_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0)
        onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      let body = null;
      try {
        body = JSON.parse(request.responseText);
      } catch {
        /* resposta sem JSON */
      }
      const url = body?.secure_url;
      if (request.status >= 200 && request.status < 300 && url?.startsWith("https://")) {
        onProgress(1);
        resolve(url);
      } else {
        reject(new Error(uploadErrorMessage(request.status, body)));
      }
    };
    request.onerror = () =>
      reject(new Error("Sem ligação ao enviar a imagem. Verifique a rede."));
    request.ontimeout = () =>
      reject(new Error("O envio da imagem demorou demasiado."));
    request.onabort = () =>
      reject(new Error("O envio da imagem foi interrompido."));
    request.send(form);
  });
