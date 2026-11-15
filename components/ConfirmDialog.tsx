"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { Icon, type IconName } from "./Icon";

interface ConfirmDialogProps {
  title: string;
  text: ReactNode;
  confirmLabel: string;
  icon?: IconName;
  onConfirm: () => void;
  onCancel: () => void;
}

// A confirmação de uma ação que não se desfaz (remover um serviço, cancelar uma contratação,
// terminar a sessão). Fecha com Escape ou ao clicar fora.
export function ConfirmDialog({
  title,
  text,
  confirmLabel,
  icon = "close",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  return (
    <div
      className="modal-backdrop logout-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="logout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <span className="logout-modal-icon">
          <Icon name={icon} />
        </span>
        <h2 id="confirm-title">{title}</h2>
        <p>{text}</p>
        <div className="logout-modal-actions">
          <button className="button button-outline" onClick={onCancel}>
            Cancelar
          </button>
          <button className="button button-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
