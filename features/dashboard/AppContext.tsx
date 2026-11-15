"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { IconName } from "../../components/Icon";
import type { Service, Transaction, User } from "../../types/domain";
import type { PageKey } from "./navigation";

/** A confirmação de uma ação que não se desfaz. */
export interface ConfirmOptions {
  title: string;
  text: ReactNode;
  confirmLabel: string;
  icon?: IconName;
  run: () => void | Promise<void>;
}

/** O que o painel partilha com as suas páginas. */
export interface AppContextValue {
  user: User;
  /** Os serviços: todos, para o cliente; só os seus, para o prestador. */
  services: Service[];
  /** As contratações da pessoa autenticada (o histórico). */
  transactions: Transaction[];
  /** Há uma operação em curso (as ações ficam desativadas para não se repetirem). */
  busy: boolean;
  /** Corre uma operação, mostra o erro ou o aviso de sucesso e recarrega os dados. */
  run: (work: () => Promise<unknown>, success?: string) => Promise<boolean>;
  reload: () => Promise<void>;
  /** Volta a pedir o utilizador à API (o saldo muda ao contratar, cancelar ou carregar). */
  refreshUser: () => Promise<void>;
  notify: (message: string) => void;
  fail: (message: string) => void;
  confirm: (options: ConfirmOptions) => void;
  go: (page: PageKey) => void;
  signOut: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  value,
  children,
}: {
  value: AppContextValue;
  children: ReactNode;
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp só se usa dentro do painel.");
  return value;
}
