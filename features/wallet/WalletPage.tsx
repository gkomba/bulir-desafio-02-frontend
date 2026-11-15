"use client";

import { useRef, useState, type FormEvent } from "react";
import { Icon } from "../../components/Icon";
import { newIdempotencyKey } from "../../lib/bookings";
import { money } from "../../lib/format";
import { addBalance, MAX_PAYMENT_KWANZAS } from "../../lib/payments";
import { ApiError } from "../../lib/api";
import { useCards } from "../account/useCards";
import { useApp } from "../dashboard/AppContext";
import { TransactionTable } from "../bookings/TransactionTable";

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000] as const;

// A carteira. O cliente carrega saldo (pagamentos simulados); o prestador recebe-o ao ser
// contratado e só o consulta (o backend não tem levantamentos).
export function WalletPage() {
  const { user, transactions, busy, run, refreshUser, fail, go } = useApp();
  const { cards } = useCards(user.id);
  // O cartão escolhido, se ainda existir; senão o predefinido (os cartões podem ser removidos).
  const [chosen, setChosen] = useState("");
  const cardId = cards.some((card) => card.id === chosen)
    ? chosen
    : (cards.find((card) => card.isDefault) ?? cards[0])?.id;
  const isClient = user.role === "CLIENT";
  // A Idempotency-Key do carregamento em curso: a mesma enquanto o valor for o mesmo e o resultado
  // for incerto (rede, servidor), para repetir não carregar duas vezes. Uma recusa certa usa uma
  // chave nova na tentativa seguinte.
  const attempt = useRef<{ amount: number; key: string } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const amount = Number(String(new FormData(form).get("amount")).replace(",", "."));
    if (!cardId) return fail("Adicione um cartão em Definições para carregar saldo.");
    if (!(amount > 0)) return fail("Introduza um valor maior que zero.");
    if (amount > MAX_PAYMENT_KWANZAS)
      return fail(`O valor máximo de cada carregamento é ${money(MAX_PAYMENT_KWANZAS)}.`);
    if (attempt.current?.amount !== amount)
      attempt.current = { amount, key: newIdempotencyKey() };
    const { key } = attempt.current;

    let refused = false;
    const succeeded = await run(async () => {
      try {
        await addBalance(amount, key);
      } catch (e) {
        // Só estas recusas são certas: 402 (o pagamento ficou gravado como falhado, e repetir com a
        // mesma chave devolveria o mesmo) e 400 ou 422 (nada foi criado). Tudo o resto (rede,
        // servidor, conflito, pedido em curso) é incerto: a chave mantém-se.
        refused = e instanceof ApiError && [400, 402, 422].includes(e.status);
        throw e;
      }
      form.reset();
    }, "Saldo adicionado.");
    if (succeeded || refused) attempt.current = null;
    if (succeeded) {
      // O pagamento já correu bem: se só a recarga do saldo falhar, diz-se, sem parecer que falhou.
      await refreshUser().catch(() =>
        fail("Saldo adicionado, mas não foi possível atualizar o saldo. Recarregue a página."),
      );
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">GESTÃO DE SALDO</span>
          <h1>A sua carteira</h1>
          <p>
            {isClient
              ? "Adicione saldo e pague pelos serviços com facilidade."
              : "Consulte os seus ganhos: os pagamentos dos clientes entram no seu saldo."}
          </p>
        </div>
      </div>
      <div className="wallet-layout">
        <div className="balance-card balance-card-large">
          <div className="balance-card-top">
            <span>{isClient ? "Saldo disponível" : "Saldo de ganhos"}</span>
            <Icon name="account_balance_wallet" className="balance-icon" />
          </div>
          <strong>{money(user.balance)}</strong>
          <div className="balance-card-bottom">
            <span>Atualizado agora</span>
            <span className="secure-note">
              <Icon name="verified_user" /> Conta protegida
            </span>
          </div>
        </div>
        {isClient ? (
          <div className="panel wallet-form">
            <div className="panel-title">
              <Icon name="add" className="form-icon" />
              <div>
                <h2>Adicionar saldo</h2>
                <p>Escolha o valor que pretende adicionar.</p>
              </div>
            </div>
            <form className="form-stack" onSubmit={submit}>
              {cards.length === 0 ? (
                <div className="wallet-no-card">
                  <p>Para adicionar saldo, adicione primeiro um cartão em Definições.</p>
                  <button type="button" className="button button-outline" onClick={() => go("settings")}>
                    <Icon name="credit_card" /> Adicionar cartão
                  </button>
                </div>
              ) : (
                <label>
                  Pagar com
                  <select name="card" value={cardId} onChange={(event) => setChosen(event.target.value)}>
                    {cards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.brand} •••• {card.last4}
                        {card.isDefault ? " (predefinido)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Valor em Kz
                <input
                  name="amount"
                  required
                  type="number"
                  min={1}
                  max={MAX_PAYMENT_KWANZAS}
                  step="any"
                  placeholder="Ex.: 10 000"
                />
              </label>
              <div className="quick-amounts">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    type="button"
                    key={amount}
                    onClick={(event) => {
                      const input = event.currentTarget.form?.elements.namedItem("amount");
                      if (input instanceof HTMLInputElement) input.value = String(amount);
                    }}
                  >
                    {amount / 1000} mil
                  </button>
                ))}
              </div>
              <button className="button button-primary button-wide" disabled={busy || !cardId}>
                {busy ? "A processar…" : "Adicionar saldo"}{" "}
                <Icon name="arrow_forward" className="button-icon" />
              </button>
            </form>
          </div>
        ) : (
          <div className="panel wallet-form">
            <div className="panel-title">
              <Icon name="verified_user" className="form-icon" />
              <div>
                <h2>Como recebe</h2>
                <p>
                  Quando um cliente contrata um dos seus serviços, o valor entra diretamente no
                  seu saldo. O levantamento ainda não está disponível.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="section-heading section-heading-spaced">
        <div>
          <h2>Movimentos recentes</h2>
          <p>Movimentos de contratação e vendas</p>
        </div>
      </div>
      <TransactionTable rows={transactions.slice(0, 5)} isClient={isClient} />
    </>
  );
}
