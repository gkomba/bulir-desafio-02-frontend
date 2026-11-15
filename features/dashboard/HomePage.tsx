"use client";

import { Empty } from "../../components/Empty";
import { Icon } from "../../components/Icon";
import { money } from "../../lib/format";
import type { Service } from "../../types/domain";
import { TransactionTable } from "../bookings/TransactionTable";
import { ServiceCard } from "../services/ServiceCard";
import { ServiceDetail } from "../services/ServiceDetail";
import { useApp } from "./AppContext";
import { useState } from "react";

// O início: o saldo, o resumo da atividade, os serviços e as últimas contratações.
export function HomePage() {
  const { user, services, transactions, go } = useApp();
  const [selected, setSelected] = useState<Service | null>(null);
  const isClient = user.role === "CLIENT";
  const firstName = user.name.split(" ")[0];
  // Uma contratação cancelada devolve o valor ao cliente: não conta para o total.
  const total = transactions
    .filter((transaction) => transaction.status !== "CANCELLED")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{isClient ? "O SEU ESPAÇO" : "PAINEL DO PRESTADOR"}</span>
          <h1>{isClient ? `Olá, ${firstName}` : `Bom dia, ${firstName}`}</h1>
          <p>
            {isClient
              ? "Encontre o profissional certo para o que precisa."
              : "Veja como está a sua atividade hoje."}
          </p>
        </div>
        {isClient ? (
          <button className="button button-primary" onClick={() => go("explore")}>
            Encontrar serviço <Icon name="arrow_forward" className="button-icon" />
          </button>
        ) : (
          <button className="button button-primary" onClick={() => go("services")}>
            <Icon name="add" /> Publicar serviço
          </button>
        )}
      </div>
      <div className="overview-grid">
        <div className="balance-card">
          <div className="balance-card-top">
            <span>{isClient ? "Saldo disponível" : "Saldo (ganhos)"}</span>
            <Icon name="account_balance_wallet" className="balance-icon" />
          </div>
          <strong>{money(user.balance)}</strong>
          <div className="balance-card-bottom">
            <span>
              {isClient
                ? "Use o saldo para contratar serviços."
                : "Os ganhos entram no saldo quando um cliente contrata."}
            </span>
            <button onClick={() => go("wallet")}>
              {isClient ? "Adicionar saldo" : "Ver carteira"}{" "}
              <Icon name="arrow_forward" className="button-icon" />
            </button>
          </div>
        </div>
        <div className="stat-card">
          <Icon name="trending_up" className="stat-icon teal" />
          <div>
            <small>{isClient ? "Contratações" : "Vendas realizadas"}</small>
            <strong>{transactions.length}</strong>
            <span>{transactions.length ? "No seu histórico" : "Ainda sem atividade"}</span>
          </div>
        </div>
        <div className="stat-card">
          <Icon name="schedule" className="stat-icon blue" />
          <div>
            <small>{isClient ? "Total gasto" : "Receita total"}</small>
            <strong>{money(total)}</strong>
            <span>{isClient ? "Em serviços contratados" : "Em serviços contratados por clientes"}</span>
          </div>
        </div>
      </div>
      {isClient ? (
        <>
          <div className="section-heading">
            <div>
              <h2>Serviços recentes</h2>
              <p>Os últimos serviços publicados</p>
            </div>
            <button className="text-link" onClick={() => go("explore")}>
              Ver todos <Icon name="arrow_forward" className="button-icon" />
            </button>
          </div>
          <div className="service-grid">
            {services.slice(0, 4).map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => setSelected(service)}
              />
            ))}
            {!services.length && (
              <Empty
                title="Ainda não há serviços"
                text="Quando os prestadores publicarem serviços, aparecem aqui."
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="section-heading">
            <div>
              <h2>Os seus serviços</h2>
              <p>Os serviços visíveis para os clientes</p>
            </div>
            <button className="text-link" onClick={() => go("services")}>
              Gerir serviços <Icon name="arrow_forward" className="button-icon" />
            </button>
          </div>
          <div className="service-grid">
            {services.slice(0, 4).map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => go("services")}
              />
            ))}
            {!services.length && (
              <Empty
                title="Ainda não publicou serviços"
                text="Crie o seu primeiro serviço para começar a receber pedidos."
                action="Publicar serviço"
                onClick={() => go("services")}
              />
            )}
          </div>
        </>
      )}
      <div className="section-heading section-heading-spaced">
        <div>
          <h2>Atividade recente</h2>
          <p>As últimas movimentações da sua conta</p>
        </div>
        <button className="text-link" onClick={() => go("history")}>
          Ver histórico <Icon name="arrow_forward" className="button-icon" />
        </button>
      </div>
      <TransactionTable rows={transactions.slice(0, 4)} isClient={isClient} />
      {selected && <ServiceDetail service={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
