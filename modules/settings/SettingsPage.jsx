"use client";

import { useState } from "react";
import { api, json } from "../../core/api";
import { Icon } from "../../core/ui";

const copy = {
  pt: {
    eyebrow: "PREFERÊNCIAS DA CONTA",
    title: "Definições",
    subtitle: "Gira a sua conta, segurança e preferências.",
    account: "Conta e segurança",
    profile: "Dados pessoais",
    name: "Nome completo",
    phone: "Telefone",
    email: "E-mail",
    save: "Guardar alterações",
    password: "Alterar palavra-passe",
    current: "Palavra-passe atual",
    next: "Nova palavra-passe",
    confirm: "Confirmar palavra-passe",
    savePassword: "Atualizar palavra-passe",
    preferences: "Preferências",
    notifications: "Notificações",
    notificationsHint: "Receber avisos sobre atividade da conta",
    hireConfirm: "Confirmar antes de contratar",
    hireHint: "Pedir confirmação antes de iniciar uma contratação",
    language: "Idioma",
    portuguese: "Português",
    english: "English",
    payments: "Métodos de pagamento",
    noCards: "Ainda não adicionou cartões.",
    addCard: "Adicionar cartão",
    holder: "Nome do titular",
    number: "Número do cartão",
    expiry: "Validade (MM/AA)",
    add: "Guardar cartão",
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
    logoutConfirm: "Tem a certeza de que pretende terminar a sessão?",
    success: "Alterações guardadas.",
    passwordSuccess: "Palavra-passe atualizada.",
    passwordMismatch: "As palavras-passe não coincidem.",
  },
  en: {
    eyebrow: "ACCOUNT PREFERENCES",
    title: "Settings",
    subtitle: "Manage your account, security, and preferences.",
    account: "Account and security",
    profile: "Personal details",
    name: "Full name",
    phone: "Phone",
    email: "Email",
    save: "Save changes",
    password: "Change password",
    current: "Current password",
    next: "New password",
    confirm: "Confirm password",
    savePassword: "Update password",
    preferences: "Preferences",
    notifications: "Notifications",
    notificationsHint: "Receive account activity updates",
    hireConfirm: "Confirm before hiring",
    hireHint: "Ask before starting a service booking",
    language: "Language",
    portuguese: "Português",
    english: "English",
    payments: "Payment methods",
    noCards: "No cards have been added yet.",
    addCard: "Add card",
    holder: "Cardholder name",
    number: "Card number",
    expiry: "Expiry (MM/YY)",
    add: "Save card",
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
    logoutConfirm: "Are you sure you want to sign out?",
    success: "Changes saved.",
    passwordSuccess: "Password updated.",
    passwordMismatch: "Passwords do not match.",
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

function Toggle({ checked, onChange, label }) {
  return (
    <label className="settings-switch" aria-label={label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span />
    </label>
  );
}

export default function SettingsPage({
  user,
  onUserUpdate,
  language,
  setLanguage,
  preferences,
  setPreferences,
  cards,
  setCards,
  onLogout,
  onToast,
  onError,
}) {
  const t = copy[language] ?? copy.pt;
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [card, setCard] = useState({ holder: "", number: "", expiry: "" });
  const [busy, setBusy] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    onError("");
    try {
      const updated = await api(
        "/me",
        json("PUT", { name: name.trim(), phone: phone.trim() }),
      );
      onUserUpdate(updated);
      onToast(t.success);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    onError("");
    if (password.next !== password.confirm) return onError(t.passwordMismatch);
    setBusy(true);
    try {
      await api(
        "/me/password",
        json("POST", {
          currentPassword: password.current,
          newPassword: password.next,
        }),
      );
      setPassword({ current: "", next: "", confirm: "" });
      onToast(t.passwordSuccess);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy(false);
    }
  };

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
              <p>
                {t.email}: {user.email}
              </p>
            </div>
          </div>
          <form
            className="settings-form settings-form-inline"
            onSubmit={saveProfile}
          >
            <label>
              {t.name}
              <input
                required
                minLength="3"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              {t.phone}
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <button className="button button-primary" disabled={busy}>
              {t.save}
            </button>
          </form>
        </div>
        <div className="settings-block">
          <div className="settings-block-heading">
            <span className="settings-icon">
              <Icon name="lock" />
            </span>
            <div>
              <h3>{t.password}</h3>
              <p>{t.current} ·••••••••</p>
            </div>
          </div>
          <form
            className="settings-form settings-form-inline"
            onSubmit={savePassword}
          >
            <label>
              {t.current}
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password.current}
                onChange={(event) =>
                  setPassword({ ...password, current: event.target.value })
                }
              />
            </label>
            <label>
              {t.next}
              <input
                required
                minLength="6"
                type="password"
                autoComplete="new-password"
                value={password.next}
                onChange={(event) =>
                  setPassword({ ...password, next: event.target.value })
                }
              />
            </label>
            <label>
              {t.confirm}
              <input
                required
                minLength="6"
                type="password"
                autoComplete="new-password"
                value={password.confirm}
                onChange={(event) =>
                  setPassword({ ...password, confirm: event.target.value })
                }
              />
            </label>
            <button className="button button-primary" disabled={busy}>
              {t.savePassword}
            </button>
          </form>
        </div>
      </Group>

      <Group title={t.preferences}>
        <div className="settings-row">
          <div>
            <b>{t.notifications}</b>
            <small>{t.notificationsHint}</small>
          </div>
          <Toggle
            label={t.notifications}
            checked={preferences.notifications}
            onChange={(value) =>
              setPreferences({ ...preferences, notifications: value })
            }
          />
        </div>
        {user.role === "CLIENT" && (
          <div className="settings-row">
            <div>
              <b>{t.hireConfirm}</b>
              <small>{t.hireHint}</small>
            </div>
            <Toggle
              label={t.hireConfirm}
              checked={preferences.confirmHire}
              onChange={(value) =>
                setPreferences({ ...preferences, confirmHire: value })
              }
            />
          </div>
        )}
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
