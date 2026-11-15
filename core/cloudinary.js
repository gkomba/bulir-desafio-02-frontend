// Endereços otimizados das imagens do Cloudinary. Em vez da original (vários MB), pede-se ao
// Cloudinary a imagem já no tamanho certo, com formato (WebP ou AVIF) e qualidade automáticos.
const UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

// Larguras, em píxeis, em que se pede cada imagem. Poucos escalões, e não "o tamanho exato" de cada
// sítio, para a rede de distribuição guardar poucas versões e reaproveitá-las entre ecrãs.
export const WIDTH_STEPS = [320, 480, 720, 1080, 1440];

// Só as imagens do Cloudinary se transformam; qualquer outro endereço segue como está.
export const isCloudinaryUrl = (url) => UPLOAD.test(url ?? "");

// A imagem com a largura máxima pedida, sem recortar nem ampliar (`c_limit`).
export const optimizedUrl = (url, width) => {
  const match = UPLOAD.exec(url ?? "");
  if (!match) return url;
  return `${match[1]}c_limit,w_${width},q_auto,f_auto/${match[2]}`;
};

// O `srcset`: o navegador escolhe o escalão que serve ao tamanho e à densidade do ecrã.
export const srcSet = (url, widths = WIDTH_STEPS) =>
  isCloudinaryUrl(url)
    ? widths.map((width) => `${optimizedUrl(url, width)} ${width}w`).join(", ")
    : undefined;
