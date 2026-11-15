"use client";

import { useState } from "react";
import { Icon } from "../../core/ui";

const copy = {
  pt: {
    eyebrow: "PREFERÊNCIAS DA CONTA",
    title: "Definições",
    subtitle: "Consulte a sua conta e escolha as preferências.",
    account: "A sua conta",
    profile: "Dados pessoais",
    readOnlyHint: "Os dados da conta não podem ser alterados nesta versão.",
    role: "Perfil",
    client: "Cliente",
    provider: "Prestador",
    name: "Nome completo",
    email: "E-mail",
    preferences: "Preferências",
    language: "Idioma",
    portuguese: "Português",
    english: "English",
    payments: "Métodos de pagamento",
    noCards: "Ainda não adicionou cartões.",
    addCard: "Adicionar cartão",
    holder: "Nome do titular",
    number: "Número do cartão",
    expiry: "Validade (MM/AA)",
    default: "Predefinido",
    makeDefault: "Tornar predefinido",
    remove: "Remover",
    help: "Ajuda e suporte",
    helpText:
      "A nossa equipa está disponível para ajudar com a sua conta e serviços.",
    contact: "Contactar suporte",
    privacy: "Privacidade e termos",
    privacyText:
      "Os dados da conta são utilizados para operar o Presta-ja, processar contratações e proteger a sua sessão. Não guarde dados de cartão completos nesta aplicação.",
    about: "Sobre o Presta-ja",
    version: "Versão",
    session: "Sessão",
    logout: "Terminar sessão",
    success: "Alterações guardadas.",
  },
  en: {
    eyebrow: "ACCOUNT PREFERENCES",
    title: "Settings",
    subtitle: "Review your account and choose your preferences.",
    account: "Your account",
    profile: "Personal details",
    readOnlyHint: "Account details cannot be changed in this version.",
    role: "Profile",
    client: "Client",
    provider: "Provider",
    name: "Full name",
    email: "Email",
    preferences: "Preferences",
    language: "Language",
    portuguese: "Português",
    english: "English",
    payments: "Payment methods",
    noCards: "No cards have been added yet.",
    addCard: "Add card",
    holder: "Cardholder name",
    number: "Card number",
    expiry: "Expiry (MM/YY)",
    default: "Default",
    makeDefault: "Make default",
    remove: "Remove",
    help: "Help and support",
    helpText: "Our team can help with your account and services.",
    contact: "Contact support",
    privacy: "Privacy and terms",
    privacyText:
      "Account data is used to operate Presta-ja, process bookings, and protect your session. Full card details are not stored in this application.",
    about: "About Presta-ja",
    version: "Version",
    session: "Session",
    logout: "Sign out",
    success: "Changes saved.",
  },
};

function Group({ title, children }) {
  return (
    <section className="settings-group">
      <h2>{title}</h2>
      <div className="panel settings-panel">{children}</div>
    </section>
  );
}

export default function SettingsPage({
  user,
  language,
  setLanguage,
  cards,
  setCards,
  onLogout,
  onToast,
  onError,
}) {
  const t = copy[language] ?? copy.pt;
  const [card, setCard] = useState({ holder: "", number: "", expiry: "" });

  const addCard = (event) => {
    event.preventDefault();
    const digits = card.number.replace(/\D/g, "");
    if (digits.length !== 16)
      return onError("O número do cartão deve ter 16 dígitos.");
    onError("");
    const next = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      brand: digits.startsWith("4") ? "Visa" : "Mastercard",
      last4: digits.slice(-4),
      holder: card.holder.trim(),
      expiry: card.expiry,
      isDefault: cards.length === 0,
    };
    setCards((current) => [...current, next]);
    setCard({ holder: "", number: "", expiry: "" });
    onToast(t.success);
  };

  return (
    <>
      <div className="page-heading settings-heading">
        <div>
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>
      <Group title={t.account}>
        <div className="settings-block">
          <div className="settings-block-heading">
            <span className="settings-icon">
              <Icon name="person" />
            </span>
            <div>
              <h3>{t.profile}</h3>
              <p>{t.readOnlyHint}</p>
            </div>
          </div>
          <dl className="settings-details">
            <div>
              <dt>{t.name}</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>{t.email}</dt>
              <dd>{user.email}</dd>
            </div>
            {user.nif && (
              <div>
                <dt>NIF</dt>
                <dd>{user.nif}</dd>
              </div>
            )}
            <div>
              <dt>{t.role}</dt>
              <dd>{user.role === "CLIENT" ? t.client : t.provider}</dd>
            </div>
          </dl>
        </div>
      </Group>

      <Group title={t.preferences}>
        <div className="settings-row">
          <div>
            <b>{t.language}</b>
            <small>{language === "pt" ? t.portuguese : t.english}</small>
          </div>
          <div className="settings-choice">
            {[
              ["pt", t.portuguese],
              ["en", t.english],
            ].map(([value, label]) => (
              <button
                key={value}
                className={language === value ? "selected" : ""}
                onClick={() => setLanguage(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Group>

      <Group title={t.payments}>
        {cards.length === 0 && <p className="settings-empty">{t.noCards}</p>}
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
            {saved.isDefault && (
              <span className="default-card-label">{t.default}</span>
            )}
            <button
              className="settings-text-button"
              onClick={() =>
                setCards((current) =>
                  current.map((entry) => ({
                    ...entry,
                    isDefault: entry.id === saved.id,
                  })),
                )
              }
            >
              {t.makeDefault}
            </button>
            <button
              className="settings-remove"
              onClick={() =>
                setCards((current) => {
                  const remaining = current.filter(
                    (entry) => entry.id !== saved.id,
                  );
                  if (saved.isDefault && remaining[0])
                    remaining[0].isDefault = true;
                  return remaining;
                })
              }
            >
              {t.remove}
            </button>
          </div>
        ))}
        <form className="settings-form settings-card-form" onSubmit={addCard}>
          <label>
            {t.holder}
            <input
              required
              value={card.holder}
              onChange={(event) =>
                setCard({ ...card, holder: event.target.value })
              }
            />
          </label>
          <label>
            {t.number}
            <input
              required
              inputMode="numeric"
              minLength="12"
              maxLength="23"
              value={card.number}
              onChange={(event) =>
                setCard({ ...card, number: event.target.value })
              }
            />
          </label>
          <label>
            {t.expiry}
            <input
              required
              pattern="(0[1-9]|1[0-2])/[0-9]{2}"
              placeholder="MM/AA"
              maxLength="5"
              value={card.expiry}
              onChange={(event) =>
                setCard({ ...card, expiry: event.target.value })
              }
            />
          </label>
          <button className="button button-outline">
            <Icon name="add" />
            {t.addCard}
          </button>
          <small className="settings-security-note">
            Guardamos apenas a marca e os últimos quatro dígitos. O CVV não é
            solicitado nem armazenado.
          </small>
        </form>
      </Group>

      <Group title={t.help}>
        <div className="settings-info-row">
          <span className="settings-icon">
            <Icon name="support_agent" />
          </span>
          <div>
            <b>{t.help}</b>
            <small>{t.helpText}</small>
          </div>
          <a
            className="button button-outline"
            href="mailto:suporte@bulir.com?subject=Suporte%20Presta-ja"
          >
            {t.contact}
          </a>
        </div>
        <details className="settings-disclosure">
          <summary>{t.privacy}</summary>
          <p>{t.privacyText}</p>
        </details>
        <div className="settings-info-row">
          <span className="settings-icon">
            <Icon name="info" />
          </span>
          <div>
            <b>{t.about}</b>
            <small>{t.version} 1.0.0</small>
          </div>
        </div>
      </Group>
      <Group title={t.session}>
        <div className="settings-session-row">
          <div>
            <b>{user.name}</b>
            <small>{user.email}</small>
          </div>
          <button
            className="button button-outline settings-logout"
            onClick={onLogout}
          >
            <Icon name="logout" />
            {t.logout}
          </button>
        </div>
      </Group>
    </>
  );
}
