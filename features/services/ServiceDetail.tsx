"use client";

import { useEffect, useState } from "react";
import { Icon } from "../../components/Icon";
import { money } from "../../lib/format";
import type { Service } from "../../types/domain";
import { useApp } from "../dashboard/AppContext";
import { HireModal } from "../bookings/HireModal";
import { ServiceImage } from "./ServiceImage";

// O detalhe de um serviço. O cliente pode contratá-lo a partir daqui.
export function ServiceDetail({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const { user } = useApp();
  const [hiring, setHiring] = useState(false);

  // Escape fecha o detalhe (a menos que a contratação esteja aberta: essa fecha-se a si própria).
  useEffect(() => {
    if (hiring) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [hiring, onClose]);

  return (
    <>
      <div
        className="modal-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <article className="service-modal">
          <button className="modal-close" aria-label="Fechar" onClick={onClose}>
            <Icon name="close" />
          </button>
          <ServiceImage service={service} large />
          <div className="modal-content">
            <span className="category-tag">{service.category}</span>
            <h2>{service.title}</h2>
            <p className="provider-by">
              Prestado por <b>{service.providerName}</b>
            </p>
            <p className="modal-description">{service.description}</p>
            <div className="modal-price">
              <small>Preço do serviço</small>
              <strong>{money(service.price)}</strong>
            </div>
            {user.role === "CLIENT" && (
              <button
                className="button button-primary button-wide"
                onClick={() => setHiring(true)}
              >
                Contratar serviço <Icon name="arrow_forward" className="button-icon" />
              </button>
            )}
          </div>
        </article>
      </div>
      {hiring && (
        <HireModal
          service={service}
          onClose={() => setHiring(false)}
          onHired={onClose}
        />
      )}
    </>
  );
}
