"use client";

import { Brand } from "../../components/Brand";
import { AuthPage } from "../auth/AuthPage";
import { useSession } from "../session/useSession";
import { Dashboard } from "./Dashboard";

// A entrada da aplicação: espera pela resposta da API sobre a sessão e mostra a entrada (login e
// registo) ou o painel.
export function AppEntry() {
  const { session, signIn, updateUser, signOut } = useSession();

  if (session.status === "loading")
    return (
      <div className="loading-screen">
        <Brand />
        <span className="spinner" />
      </div>
    );
  if (session.status === "anonymous")
    return <AuthPage notice={session.notice} onLogin={signIn} />;
  return (
    <Dashboard user={session.user} onUserChange={updateUser} onSignOut={signOut} />
  );
}
