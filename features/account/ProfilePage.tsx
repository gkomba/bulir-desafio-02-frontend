"use client";

import { money } from "../../lib/format";
import { useApp } from "../dashboard/AppContext";

// Os dados da conta, só de leitura: o backend não permite alterá-los.
export function ProfilePage() {
  const { user } = useApp();
  const isClient = user.role === "CLIENT";

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A SUA CONTA</span>
          <h1>Perfil</h1>
          <p>Os seus dados.</p>
        </div>
      </div>
      <div className="panel profile-card">
        <div className="profile-avatar">{user.name.charAt(0)}</div>
        <div className="profile-details">
          <span className="eyebrow">{isClient ? "CLIENTE" : "PRESTADOR"}</span>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <div className="profile-balance">
          <small>Saldo atual</small>
          <strong>{money(user.balance)}</strong>
        </div>
      </div>
      <div className="panel profile-info">
        <h2>Dados da conta</h2>
        <div>
          <span>Nome</span>
          <b>{user.name}</b>
        </div>
        <div>
          <span>E-mail</span>
          <b>{user.email}</b>
        </div>
        {user.nif && (
          <div>
            <span>NIF</span>
            <b>{user.nif}</b>
          </div>
        )}
        <div>
          <span>Tipo de perfil</span>
          <b>{isClient ? "Cliente" : "Prestador"}</b>
        </div>
      </div>
    </>
  );
}
