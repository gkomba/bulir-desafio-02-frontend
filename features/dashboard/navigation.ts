import type { IconName } from "../../components/Icon";
import type { Role } from "../../types/domain";

export type PageKey =
  | "home"
  | "explore"
  | "services"
  | "wallet"
  | "history"
  | "profile"
  | "settings";

export interface NavItem {
  key: PageKey;
  label: string;
  icon: IconName;
}

const WALLET: NavItem = { key: "wallet", label: "Carteira", icon: "account_balance_wallet" };
const HISTORY: NavItem = { key: "history", label: "Histórico", icon: "history" };
const PROFILE: NavItem = { key: "profile", label: "Perfil", icon: "person" };
const SETTINGS: NavItem = { key: "settings", label: "Definições", icon: "settings" };

// O que cada perfil vê no menu. O cliente explora e contrata serviços; o prestador publica os seus.
export const navigationFor = (role: Role): NavItem[] =>
  role === "CLIENT"
    ? [
        { key: "home", label: "Início", icon: "home" },
        { key: "explore", label: "Explorar serviços", icon: "search" },
        WALLET,
        HISTORY,
        PROFILE,
        SETTINGS,
      ]
    : [
        { key: "home", label: "Visão geral", icon: "home" },
        { key: "services", label: "Os meus serviços", icon: "grid_view" },
        WALLET,
        HISTORY,
        PROFILE,
        SETTINGS,
      ];
