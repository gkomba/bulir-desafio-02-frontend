"use client";

import { useEffect, useState } from "react";
import { api, json, setToken } from "../../core/api";
import { Brand, Icon } from "../../core/ui";

export default function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    nif: "",
    identifier: "",
    password: "",
    role: "CLIENT",
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") setRegister(true);
    const role = params.get("role");
    if (role === "CLIENT" || role === "PROVIDER") {
      setData((current) => ({ ...current, role }));
    }
  }, []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) =>
    setData((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api(
        register ? "/auth/register" : "/auth/login",
        json(
          "POST",
          register
            ? {
                name: data.name,
                email: data.email,
                nif: data.role === "PROVIDER" ? data.nif : undefined,
                password: data.password,
                role: data.role,
              }
            : { identifier: data.identifier, password: data.password },
        ),
      );
      setToken(result.token);
      onLogin(result.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-art">
        <Brand />
        <div className="auth-copy">
          <span className="eyebrow">SERVIÇOS PERTO DE SI</span>
          <h1>O próximo bom serviço começa aqui.</h1>
          <p>
            Encontre profissionais de confiança ou transforme o seu talento em
            novas oportunidades.
          </p>
          <div className="trust-row">
            <span>
              <Icon name="check_circle" /> Profissionais locais
            </span>
            <span>
              <Icon name="check_circle" /> Pagamentos simples
            </span>
          </div>
        </div>
        <div className="auth-art-note">Uma comunidade a trabalhar melhor.</div>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-box">
          <span className="eyebrow">
            {register ? "COMECE AGORA" : "BEM-VINDO DE VOLTA"}
          </span>
          <h2>{register ? "Criar conta" : "Entre na sua conta"}</h2>
          <p className="muted">
            {register
              ? "Escolha como quer utilizar o Presta-ja."
              : "Aceda aos seus serviços e à sua carteira."}
          </p>
          <div className="auth-switch">
            <button
              className={!register ? "selected" : ""}
              onClick={() => setRegister(false)}
            >
              Entrar
            </button>
            <button
              className={register ? "selected" : ""}
              onClick={() => setRegister(true)}
            >
              Criar conta
            </button>
          </div>
          <form onSubmit={submit} className="form-stack">
            {register && (
              <>
                <label>
                  Nome completo
                  <input
                    required
                    minLength="3"
                    placeholder="O seu nome"
                    value={data.name}
                    onChange={update("name")}
                  />
                </label>
                <label>
                  E-mail
                  <input
                    required
                    type="email"
                    placeholder="nome@email.com"
                    value={data.email}
                    onChange={update("email")}
                  />
                </label>
                <label>
                  Quero usar como
                  <select value={data.role} onChange={update("role")}>
                    <option value="CLIENT">Cliente</option>
                    <option value="PROVIDER">Prestador</option>
                  </select>
                </label>
                {data.role === "PROVIDER" && (
                  <label>
                    NIF
                    <input
                      required
                      inputMode="numeric"
                      maxLength="9"
                      placeholder="9 dígitos"
                      value={data.nif}
                      onChange={update("nif")}
                    />
                  </label>
                )}
              </>
            )}
            {!register && (
              <label>
                E-mail ou NIF
                <input
                  required
                  autoComplete="username"
                  placeholder="nome@email.com ou NIF"
                  value={data.identifier}
                  onChange={update("identifier")}
                />
              </label>
            )}
            <label>
              Palavra-passe
              <input
                required
                type="password"
                minLength={register ? 6 : undefined}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="A sua palavra-passe"
                value={data.password}
                onChange={update("password")}
              />
            </label>
            {error && <p className="error-box">{error}</p>}
            <button
              className="button button-primary button-wide"
              disabled={busy}
            >
              {busy ? "Aguarde…" : register ? "Criar conta" : "Entrar"}{" "}
              <Icon name="arrow_forward" className="button-icon" />
            </button>
          </form>
          <p className="auth-foot">
            Ao continuar, concorda com os termos de utilização do Presta-ja.
          </p>
        </div>
      </section>
    </main>
  );
}
