"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Brand } from "../../components/Brand";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Icon } from "../../components/Icon";
import { MobileNav } from "../../components/MobileNav";
import { api, errorMessage } from "../../lib/api";
import { toUser } from "../../lib/adapters";
import type { User, UserDto } from "../../types/domain";
import { HistoryPage } from "../bookings/HistoryPage";
import { ExplorePage } from "../services/ExplorePage";
import { MyServicesPage } from "../services/MyServicesPage";
import { ProfilePage } from "../account/ProfilePage";
import { SettingsPage } from "../account/SettingsPage";
import { WalletPage } from "../wallet/WalletPage";
import { AppProvider, type AppContextValue, type ConfirmOptions } from "./AppContext";
import { HomePage } from "./HomePage";
import { navigationFor, type PageKey } from "./navigation";
import { useDashboardData } from "./useDashboardData";

interface DashboardProps {
  user: User;
  onUserChange: (user: User) => void;
  onSignOut: () => void;
}

// A área da pessoa autenticada: o menu, o cabeçalho e a página escolhida. As páginas pedem ao
// painel o que partilham (o utilizador, os dados, as operações) em vez de o receberem por props.
export function Dashboard({ user, onUserChange, onSignOut }: DashboardProps) {
  const [page, setPage] = useState<PageKey>("home");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmOptions | null>(null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const { services, transactions, reload } = useDashboardData(user, setError);
  const navigation = useMemo(() => navigationFor(user.role), [user.role]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshUser = useCallback(async () => {
    onUserChange(toUser(await api<UserDto>("/auth/me")));
  }, [onUserChange]);

  // Devolve true se a operação correu bem. Se só a recarga da lista falhar, a operação já foi
  // feita (e quem chamou deve tratá-la como feita: repetir criaria um serviço em duplicado).
  const run = useCallback(
    async (work: () => Promise<unknown>, success?: string) => {
      setBusy(true);
      setError("");
      try {
        await work();
      } catch (e) {
        setError(errorMessage(e));
        setBusy(false);
        return false;
      }
      if (success) setToast(success);
      try {
        await reload();
      } catch (e) {
        setError(errorMessage(e));
      }
      setBusy(false);
      return true;
    },
    [reload],
  );

  const go = useCallback((next: PageKey) => {
    setPage(next);
    setError("");
  }, []);

  const value: AppContextValue = {
    user,
    services,
    transactions,
    busy,
    run,
    reload,
    refreshUser,
    notify: setToast,
    fail: setError,
    confirm: setConfirmation,
    go,
    signOut: () => setConfirmingSignOut(true),
  };

  const runConfirmed = async () => {
    if (!confirmation) return;
    const { run: confirmed } = confirmation;
    setConfirmation(null);
    await confirmed();
  };

  return (
    <AppProvider value={value}>
      <div className="app-shell">
        <aside className="sidebar">
          <Brand />
          <div className="side-label">MENU PRINCIPAL</div>
          <nav>
            {navigation.map(({ key, label, icon }) => (
              <button
                key={key}
                className={`nav-item ${page === key ? "active" : ""}`}
                onClick={() => go(key)}
              >
                <Icon name={icon} className="nav-glyph" />
                {label}
                {page === key && <span className="nav-active-mark" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button className="sidebar-logout" onClick={value.signOut}>
              <Icon name="logout" />
              <span>Terminar sessão</span>
            </button>
          </div>
        </aside>
        <main className="workspace">
          <header className="topbar">
            <div className="mobile-brand">
              <Brand small />
            </div>
            <div className="breadcrumb">
              <b>{navigation.find((item) => item.key === page)?.label ?? "Início"}</b>
            </div>
            <div className="top-actions">
              <span className="top-divider" />
              <button className="top-user" onClick={() => go("profile")}>
                <span className="avatar avatar-small">{user.name.charAt(0)}</span>
                <span>{user.name.split(" ")[0]}</span>
                <Icon name="keyboard_arrow_down" className="chevron" />
              </button>
            </div>
          </header>
          <section className="page-content">
            {error && (
              <div className="error-banner">
                {error}
                <button aria-label="Fechar aviso" onClick={() => setError("")}>
                  <Icon name="close" />
                </button>
              </div>
            )}
            {page === "home" && <HomePage />}
            {page === "explore" && <ExplorePage />}
            {page === "services" && <MyServicesPage />}
            {page === "wallet" && <WalletPage />}
            {page === "history" && <HistoryPage />}
            {page === "profile" && <ProfilePage />}
            {page === "settings" && <SettingsPage />}
          </section>
        </main>
        {confirmation && (
          <ConfirmDialog
            title={confirmation.title}
            text={confirmation.text}
            confirmLabel={confirmation.confirmLabel}
            {...(confirmation.icon ? { icon: confirmation.icon } : {})}
            onConfirm={runConfirmed}
            onCancel={() => setConfirmation(null)}
          />
        )}
        {confirmingSignOut && (
          <ConfirmDialog
            title="Terminar sessão?"
            text="Tem a certeza de que pretende terminar a sessão na sua conta?"
            confirmLabel="Terminar sessão"
            icon="logout"
            onConfirm={onSignOut}
            onCancel={() => setConfirmingSignOut(false)}
          />
        )}
        {toast && (
          <div className="toast">
            <Icon name="check" />
            {toast}
          </div>
        )}
        <MobileNav items={navigation} page={page} onNavigate={go} />
      </div>
    </AppProvider>
  );
}
