"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "../../components/Icon";
import { useApp } from "../dashboard/AppContext";
import { useCards } from "./useCards";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings-group">
      <h2>{title}</h2>
      <div className="panel settings-panel">{children}</div>
    </section>
  );
}

interface CardForm {
  holder: string;
  number: string;
  expiry: string;
}

const EMPTY_CARD: CardForm = { holder: "", number: "", expiry: "" };

// As definições: os dados da conta (só de leitura), os cartões guardados (locais), a ajuda e a sessão.
export function SettingsPage() {
  const { user, notify, fail, signOut } = useApp();
  const { cards, setCards } = useCards(user.id);
  const [card, setCard] = useState<CardForm>(EMPTY_CARD);

  const addCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = card.number.replace(/\D/g, "");
    if (digits.length !== 16) return fail("O número do cartão deve ter 16 dígitos.");
    fail("");
    setCards((current) => [
      ...current,
      {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
        brand: digits.startsWith("4") ? "Visa" : "Mastercard",
        last4: digits.slice(-4),
        holder: card.holder.trim(),
        expiry: card.expiry,
        isDefault: current.length === 0,
      },
    ]);
    setCard(EMPTY_CARD);
    notify("Cartão adicionado.");
  };

  const makeDefault = (id: string) =>
    setCards((current) => current.map((entry) => ({ ...entry, isDefault: entry.id === id })));

  const removeCard = (id: string) =>
    setCards((current) => {
      const remaining = current.filter((entry) => entry.id !== id);
      // Se o cartão predefinido sai, o primeiro que ficar passa a sê-lo.
      return remaining.some((entry) => entry.isDefault)
        ? remaining
        : remaining.map((entry, index) => ({ ...entry, isDefault: index === 0 }));
    });

  return (
    <>
      <div className="page-heading settings-heading">
        <div>
          <span className="eyebrow">PREFERÊNCIAS DA CONTA</span>
          <h1>Definições</h1>
          <p>Consulte a sua conta e gira os seus cartões.</p>
        </div>
      </div>

      <Group title="A sua conta">
        <div className="settings-block">
          <div className="settings-block-heading">
            <span className="settings-icon">
              <Icon name="person" />
            </span>
            <div>
              <h3>Dados pessoais</h3>
              <p>Os dados da conta não podem ser alterados nesta versão.</p>
            </div>
          </div>
          <dl className="settings-details">
            <div>
              <dt>Nome completo</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            {user.nif && (
              <div>
                <dt>NIF</dt>
                <dd>{user.nif}</dd>
              </div>
            )}
            <div>
              <dt>Perfil</dt>
              <dd>{user.role === "CLIENT" ? "Cliente" : "Prestador"}</dd>
            </div>
          </dl>
        </div>
      </Group>

      <Group title="Métodos de pagamento">
        {cards.length === 0 && <p className="settings-empty">Ainda não adicionou cartões.</p>}
        {cards.map((saved) => (
          <div className="saved-card-row" key={saved.id}>
            <span className="settings-icon">
              <Icon name="credit_card" />
            </span>
            <div>
              <b>
                {saved.brand} •••• {saved.last4}
              </b>
              <small>
                {saved.holder} · {saved.expiry}
              </small>
            </div>
            {saved.isDefault && <span className="default-card-label">Predefinido</span>}
            <button className="settings-text-button" onClick={() => makeDefault(saved.id)}>
              Tornar predefinido
            </button>
            <button className="settings-remove" onClick={() => removeCard(saved.id)}>
              Remover
            </button>
          </div>
        ))}
        <form className="settings-form settings-card-form" onSubmit={addCard}>
          <label>
            Nome do titular
            <input
              required
              value={card.holder}
              onChange={(event) => setCard({ ...card, holder: event.target.value })}
            />
          </label>
          <label>
            Número do cartão
            <input
              required
              inputMode="numeric"
              minLength={12}
              maxLength={23}
              value={card.number}
              onChange={(event) => setCard({ ...card, number: event.target.value })}
            />
          </label>
          <label>
            Validade (MM/AA)
            <input
              required
              pattern="(0[1-9]|1[0-2])/[0-9]{2}"
              placeholder="MM/AA"
              maxLength={5}
              value={card.expiry}
              onChange={(event) => setCard({ ...card, expiry: event.target.value })}
            />
          </label>
          <button className="button button-outline">
            <Icon name="add" />
            Adicionar cartão
          </button>
          <small className="settings-security-note">
            Guardamos apenas a marca e os últimos quatro dígitos. O CVV não é solicitado nem
            armazenado.
          </small>
        </form>
      </Group>

      <Group title="Ajuda e suporte">
        <div className="settings-info-row">
          <span className="settings-icon">
            <Icon name="support_agent" />
          </span>
          <div>
            <b>Ajuda e suporte</b>
            <small>A nossa equipa está disponível para ajudar com a sua conta e serviços.</small>
          </div>
          <a className="button button-outline" href="mailto:suporte@bulir.com?subject=Suporte%20Bulir">
            Contactar suporte
          </a>
        </div>
        <details className="settings-disclosure">
          <summary>Privacidade e termos</summary>
          <p>
            Os dados da conta são utilizados para operar a Bulir, processar contratações e proteger
            a sua sessão. Não guarde dados de cartão completos nesta aplicação.
          </p>
        </details>
        <div className="settings-info-row">
          <span className="settings-icon">
            <Icon name="info" />
          </span>
          <div>
            <b>Sobre a Bulir</b>
            <small>Versão 1.0.0</small>
          </div>
        </div>
      </Group>

      <Group title="Sessão">
        <div className="settings-session-row">
          <div>
            <b>{user.name}</b>
            <small>{user.email}</small>
          </div>
          <button className="button button-outline settings-logout" onClick={signOut}>
            <Icon name="logout" />
            Terminar sessão
          </button>
        </div>
      </Group>
    </>
  );
}
