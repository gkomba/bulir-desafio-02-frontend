"use client";

import { useState } from "react";
import { Icon, type IconName } from "../../components/Icon";
import { assetUrl } from "../../lib/api";
import { optimizedUrl, srcSet } from "../../lib/cloudinary";
import type { Service } from "../../types/domain";

const placeholderIcon = (service: Service): IconName =>
  service.category === "Beleza"
    ? "auto_awesome"
    : service.category === "Tecnologia"
      ? "devices"
      : "home_repair_service";

// A imagem do serviço. Sem imagem, ou se ela falhar, mostra o ícone da categoria.
export function ServiceImage({
  service,
  large = false,
}: {
  service: Service;
  large?: boolean;
}) {
  // Guarda-se qual o endereço que falhou: ao mudar de imagem, volta-se a tentar.
  const [failedUrl, setFailedUrl] = useState<string>();
  const url = assetUrl(service.imageUrl);
  const size = large ? "service-image-large" : "";

  if (!url || failedUrl === url) {
    return (
      <div className={`service-image image-placeholder ${size}`}>
        <span>
          <Icon name={placeholderIcon(service)} />
        </span>
      </div>
    );
  }
  return (
    // `<img>` e não `next/image`: o Cloudinary já entrega o tamanho, o formato e a qualidade certos
    // (ver lib/cloudinary.ts), e o otimizador do Next voltaria a processar a imagem.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`service-image ${size}`}
      src={optimizedUrl(url, large ? 720 : 480)}
      srcSet={srcSet(url)}
      sizes={
        large ? "(max-width: 900px) 100vw, 640px" : "(max-width: 700px) 100vw, 340px"
      }
      loading="lazy"
      decoding="async"
      alt=""
      onError={() => setFailedUrl(url)}
    />
  );
}
