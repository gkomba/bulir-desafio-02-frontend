"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { Brand } from "../../components/Brand";
import { Icon } from "../../components/Icon";
import { api, errorMessage, json } from "../../lib/api";
import { toUser } from "../../lib/adapters";
import type { Role, User, UserDto } from "../../types/domain";

// O ecrã só aparece no navegador (a aplicação mostra um ecrã de carregamento até lá), por isso
// pode ler o endereço logo no estado inicial, sem efeitos.
const urlParams = (): URLSearchParams =>
  typeof window === "undefined"
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search);

interface FormData {
  name: string;
  email: string;
  nif: string;
  identifier: string;
  password: string;
  role: Role;
}

interface AuthPageProps {
  onLogin: (user: User) => void;
  /** Um aviso a mostrar no formulário (por exemplo, a API não respondeu ao abrir a aplicação). */
  notice?: string;
}

export function AuthPage({ onLogin, notice = "" }: AuthPageProps) {
  const [register, setRegister] = useState(
    () => urlParams().get("mode") === "register",
  );
  const [data, setData] = useState<FormData>(() => ({
    name: "",
    email: "",
    nif: "",
    identifier: "",
    password: "",
    role: urlParams().get("role") === "PROVIDER" ? "PROVIDER" : "CLIENT",
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const update =
    (key: keyof FormData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setData((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    // A API alojada pode estar a acordar: depois de uns segundos, explica a espera.
    const slowTimer = setTimeout(() => setSlow(true), 6000);
    let created = false;
    try {
      const identifier = data.identifier.trim();
      if (register) {
        await api(
          "/auth/register",
          json("POST", {
            fullName: data.name.trim(),
            email: data.email.trim(),
            ...(data.role === "PROVIDER" ? { nif: data.nif.trim() } : {}),
            password: data.password,
            role: data.role,
          }),
        );
        created = true;
      }
      // Entra-se com o e-mail ou com o NIF (só os prestadores têm NIF).
      const credentials = register
        ? { email: data.email.trim(), password: data.password }
        : identifier.includes("@")
          ? { email: identifier, password: data.password }
          : { nif: identifier, password: data.password };
      const user = await api<UserDto>("/auth/login", json("POST", credentials));
      onLogin(toUser(user));
    } catch (e) {
      if (created) {
        // O registo correu bem e só a entrada falhou: leva para a entrada, com o e-mail já escrito.
        setRegister(false);
        setData((current) => ({ ...current, identifier: current.email }));
        setError(`Conta criada, mas não foi possível entrar: ${errorMessage(e)}`);
      } else {
        setError(errorMessage(e));
      }
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
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
          <Link className="auth-back" href="/">
            <Icon name="arrow_back" /> Voltar ao início
          </Link>
          <span className="eyebrow">
            {register ? "COMECE AGORA" : "BEM-VINDO DE VOLTA"}
          </span>
          <h2>{register ? "Criar conta" : "Entre na sua conta"}</h2>
          <p className="muted">
            {register
              ? "Escolha como quer utilizar o Bulir."
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
                    minLength={3}
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
                      pattern="[A-Za-z0-9]{9,14}"
                      title="Entre 9 e 14 letras ou números"
                      maxLength={14}
                      placeholder="9 a 14 letras ou números"
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
                minLength={register ? 8 : undefined}
                maxLength={72}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="A sua palavra-passe"
                value={data.password}
                onChange={update("password")}
              />
            </label>
            {slow && (
              <p className="muted">
                A ligar ao servidor… na primeira vez pode demorar até um minuto.
              </p>
            )}
            {(error || notice) && <p className="error-box">{error || notice}</p>}
            <button
              className="button button-primary button-wide"
              disabled={busy}
            >
              {busy ? "Aguarde…" : register ? "Criar conta" : "Entrar"}{" "}
              <Icon name="arrow_forward" className="button-icon" />
            </button>
          </form>
          <p className="auth-foot">
            Ao continuar, concorda com os termos de utilização do Bulir.
          </p>
        </div>
      </section>
    </main>
  );
}
