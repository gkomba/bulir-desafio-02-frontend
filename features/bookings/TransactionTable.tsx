import { Empty } from "../../components/Empty";
import { Icon } from "../../components/Icon";
import { statusLabel } from "../../lib/adapters";
import { dateTime, money } from "../../lib/format";
import type { Transaction } from "../../types/domain";

interface TransactionTableProps {
  rows: Transaction[];
  /** Cliente ou prestador: o cliente cancela e o prestador conclui. */
  isClient: boolean;
  busy?: boolean;
  onCancel?: (transaction: Transaction) => void;
  onComplete?: (transaction: Transaction) => void;
}

// O histórico de contratações: serviço, cliente, prestador, quando, estado e valor. Com `onCancel`
// (cliente) ou `onComplete` (prestador), as contratações confirmadas ganham a sua ação.
export function TransactionTable({
  rows,
  isClient,
  busy = false,
  onCancel,
  onComplete,
}: TransactionTableProps) {
  if (!rows.length)
    return (
      <Empty
        title="Ainda não há movimentos"
        text="As suas contratações e vendas vão aparecer aqui."
      />
    );
  const act = isClient ? onCancel : onComplete;
  return (
    <div className="panel table-panel">
      <table>
        <thead>
          <tr>
            <th>Serviço</th>
            <th>Cliente</th>
            <th>Prestador</th>
            <th>Marcada para</th>
            <th>Estado</th>
            <th className="align-right">Valor</th>
            {act && <th className="align-right">Ação</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((transaction) => (
            <tr key={transaction.id}>
              <td className="tx-service">
                <Icon name="arrow_outward" className="table-service-icon" />
                <b>{transaction.serviceTitle}</b>
              </td>
              <td data-label="Cliente">{transaction.clientName}</td>
              <td data-label="Prestador">{transaction.providerName}</td>
              <td data-label="Marcada para">{dateTime(transaction.scheduledAt)}</td>
              <td data-label="Estado">
                <span className={`status-pill is-${transaction.status.toLowerCase()}`}>
                  <i /> {statusLabel(transaction.status)}
                </span>
              </td>
              <td className="align-right" data-label="Valor">
                <b>{money(transaction.amount)}</b>
              </td>
              {act && (
                <td className="align-right">
                  {transaction.status === "CONFIRMED" && (
                    <button
                      type="button"
                      className="button button-outline table-action"
                      disabled={busy}
                      aria-label={`${isClient ? "Cancelar" : "Concluir"} ${transaction.serviceTitle}`}
                      onClick={() => act(transaction)}
                    >
                      {isClient ? "Cancelar" : "Concluir"}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
