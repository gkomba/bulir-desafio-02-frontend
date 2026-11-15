"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
import { errorMessage } from "../../lib/api";
import {
  defaultSchedule,
  newIdempotencyKey,
  placeBooking,
  toLocalInput,
} from "../../lib/bookings";
import { money } from "../../lib/format";
import type { Service } from "../../types/domain";
import { useApp } from "../dashboard/AppContext";

interface HireModalProps {
  service: Service;
  onClose: () => void;
  /** Chamado depois de a contratação correr bem (para fechar também o detalhe do serviço). */
  onHired: () => void;
}

// Confirmar a contratação: o serviço, o preço, o saldo depois e quando o serviço deve ser prestado.
// Antes de contratar verifica-se o saldo (a API faz a verificação final, de forma atómica).
export function HireModal({ service, onClose, onHired }: HireModalProps) {
  const { user, reload, refreshUser, notify } = useApp();
  const [when, setWhen] = useState(() => defaultSchedule());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // A Idempotency-Key da tentativa. A API só a grava quando a reserva é criada: uma recusa (sem
  // saldo, data inválida) não deixa nada guardado, e repetir com a mesma chave é seguro.
  const key = useRef(newIdempotencyKey());

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const insufficient = user.balance < service.price;

  const confirm = async () => {
    const scheduled = new Date(when);
    if (Number.isNaN(scheduled.getTime()) || scheduled <= new Date()) {
      setError("Escolha uma data e uma hora no futuro.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await placeBooking(service.id, scheduled, key.current);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
      return;
    }
    // A contratação já foi feita: se só a recarga falhar, não parece que a contratação falhou.
    notify("Serviço contratado com sucesso.");
    await Promise.all([reload(), refreshUser()]).catch((e: unknown) =>
      setError(errorMessage(e)),
    );
    setBusy(false);
    onHired();
    onClose();
  };

  return (
    <div
      className="modal-backdrop hire-confirm-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="hire-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hire-confirm-title"
      >
        <span className="hire-confirm-icon">
          <Icon name="check_circle" />
        </span>
        <h2 id="hire-confirm-title">Confirmar contratação?</h2>
        <p className="hire-confirm-copy">Confirme o serviço e o valor antes de continuar.</p>
        <div className="hire-confirm-summary">
          <div>
            <span>Serviço</span>
            <b>{service.title}</b>
          </div>
          <div>
            <span>Prestador</span>
            <b>{service.providerName}</b>
          </div>
          <div>
            <span>Preço</span>
            <b>{money(service.price)}</b>
          </div>
          <div>
            <span>Saldo após contratar</span>
            <b>{money(Math.max(0, user.balance - service.price))}</b>
          </div>
        </div>
        <label className="hire-schedule">
          <span>Quando?</span>
          <input
            type="datetime-local"
            value={when}
            min={toLocalInput(new Date())}
            onChange={(event) => {
              setWhen(event.target.value);
              // Outra data é outro pedido: com a mesma chave, a API recusaria a repetição.
              key.current = newIdempotencyKey();
            }}
          />
        </label>
        {insufficient && (
          <p className="hire-insufficient">
            O saldo da carteira não é suficiente para este serviço.
          </p>
        )}
        {error && <p className="hire-error">{error}</p>}
        <div className="hire-confirm-actions">
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="button button-primary"
            disabled={busy || insufficient}
            onClick={confirm}
          >
            {busy ? "A contratar…" : "Confirmar"}
          </button>
        </div>
      </section>
    </div>
  );
}
