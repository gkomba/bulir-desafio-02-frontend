"use client";

import { cancelBooking, completeBooking } from "../../lib/bookings";
import { money } from "../../lib/format";
import type { Transaction } from "../../types/domain";
import { useApp } from "../dashboard/AppContext";
import { TransactionTable } from "./TransactionTable";

// O histórico de todas as contratações da pessoa: o serviço, o cliente, o prestador e o valor.
export function HistoryPage() {
  const { user, transactions, busy, run, refreshUser, fail, confirm } = useApp();

  // Cancelar (cliente) devolve o valor ao saldo; concluir (prestador) fecha a contratação.
  const change = async (work: () => Promise<unknown>, success: string) => {
    const done = await run(work, success);
    if (done) await refreshUser().catch(() => fail("Não foi possível atualizar o saldo."));
  };

  const askCancel = (transaction: Transaction) =>
    confirm({
      title: "Cancelar a contratação?",
      text: (
        <>
          O valor de <b>{money(transaction.amount)}</b> de <b>{transaction.serviceTitle}</b>{" "}
          volta ao seu saldo.
        </>
      ),
      confirmLabel: "Cancelar contratação",
      run: () => change(() => cancelBooking(transaction.id), "Contratação cancelada."),
    });

  const complete = (transaction: Transaction) =>
    change(() => completeBooking(transaction.id), "Serviço concluído.");

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MOVIMENTOS DA CONTA</span>
          <h1>Histórico</h1>
          <p>Consulte as suas contratações e vendas.</p>
        </div>
      </div>
      <TransactionTable
        rows={transactions}
        isClient={user.role === "CLIENT"}
        busy={busy}
        onCancel={askCancel}
        onComplete={complete}
      />
    </>
  );
}
