"use client";

import { useEffect, useRef, useState } from "react";
import { assetUrl } from "../../core/api";
import { optimizedUrl, srcSet } from "../../core/cloudinary";
import { Icon } from "../../core/ui";
import { statusLabel } from "../../core/adapters";
import { date, dateTime, money } from "../../core/format";

export function ServiceImage({ service, large = false }) {
  const [failed, setFailed] = useState(false);
  return service.imageUrl && !failed ? (
    // `<img>` e não `next/image`: o Cloudinary já entrega o tamanho, o formato e a qualidade certos
    // (ver core/cloudinary.js), e o otimizador do Next voltaria a processar a imagem.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`service-image ${large ? "service-image-large" : ""}`}
      src={optimizedUrl(assetUrl(service.imageUrl), large ? 720 : 480)}
      srcSet={srcSet(assetUrl(service.imageUrl))}
      sizes={
        large
          ? "(max-width: 900px) 100vw, 640px"
          : "(max-width: 700px) 100vw, 340px"
      }
      loading="lazy"
      decoding="async"
      alt=""
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={`service-image image-placeholder ${large ? "service-image-large" : ""}`}
    >
      <span>
        <Icon
          name={
            service.category === "Beleza"
              ? "auto_awesome"
              : service.category === "Tecnologia"
                ? "devices"
                : "home_repair_service"
          }
        />
      </span>
    </div>
  );
}

export function ServiceCard({ service, onClick }) {
  return (
    <button className="service-card-button" onClick={onClick}>
      <div className="service-image-wrap">
        <ServiceImage service={service} />
        <span className="category-tag">{service.category || "Serviço"}</span>
        <span className="favorite-mark" aria-hidden="true">
          <Icon name="favorite_border" />
        </span>
      </div>
      <div className="service-card-content">
        <div className="service-provider">
          <span className="provider-dot">
            {(service.providerName || "P")[0]}
          </span>
          {service.providerName}
        </div>
        <h3>{service.title}</h3>
        <p className="service-description">{service.description}</p>
        <div className="service-card-footer">
          <strong>{money(service.price)}</strong>
          <span>
            <Icon name="star" className="rating-icon" />{" "}
            {service.rating || "Novo"}
          </span>
        </div>
      </div>
    </button>
  );
}

// O histórico de contratações: serviço, cliente, prestador, quando, estado e valor. Com `onCancel`
// (cliente) e `onComplete` (prestador), as contratações confirmadas ganham a sua ação.
export function TransactionTable({ rows, isClient, busy = false, onCancel, onComplete }) {
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
          {rows.map((tx) => (
            <tr key={tx.id}>
              <td>
                <Icon name="arrow_outward" className="table-service-icon" />
                <b>{tx.serviceTitle}</b>
              </td>
              <td>{tx.clientName}</td>
              <td>{tx.providerName}</td>
              <td>{dateTime(tx.scheduledAt)}</td>
              <td>
                <span className={`status-pill is-${tx.status.toLowerCase()}`}>
                  <i /> {statusLabel(tx.status)}
                </span>
              </td>
              <td className="align-right">
                <b>{money(tx.amount)}</b>
              </td>
              {act && (
                <td className="align-right">
                  {tx.status === "CONFIRMED" && (
                    <button
                      type="button"
                      className="button button-outline table-action"
                      disabled={busy}
                      aria-label={`${isClient ? "Cancelar" : "Concluir"} ${tx.serviceTitle}`}
                      onClick={() => act(tx)}
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

export function Empty({ title, text, action, onClick }) {
  return (
    <div className="empty-state">
      <Icon name="search_off" />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="button button-primary" onClick={onClick}>
          {action} <Icon name="arrow_forward" className="button-icon" />
        </button>
      )}
    </div>
  );
}

export function MobileNav({ items, page, setPage }) {
  return (
    <nav className="mobile-nav">
      {items.map(([key, label, glyph]) => (
        <button
          key={key}
          className={page === key ? "active" : ""}
          aria-current={page === key ? "page" : undefined}
          onClick={() => setPage(key)}
        >
          <Icon name={glyph} />
          <small>{label.split(" ")[0]}</small>
        </button>
      ))}
    </nav>
  );
}

export function FilterSelect({ label, value, options, onChange, name }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  return (
    <div className={`filter-select ${open ? "is-open" : ""}`} ref={rootRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        className="filter-select-trigger"
        aria-label={`${label}: ${selected?.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label}</span>
        <Icon name="keyboard_arrow_down" className="filter-select-chevron" />
      </button>
      {open && (
        <div className="filter-select-menu" role="menu">
          {options.map((option) => (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={option.value === value}
              key={option.value}
              className={`filter-select-option ${option.value === value ? "selected" : ""}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Icon name="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Pagination({ totalItems, pageSize, currentPage, totalPages, onPageChange }) {
  if (!totalItems) return null;
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  let pageItems = Array.from({ length: totalPages }, (_, index) => index + 1);

  if (totalPages > 5) {
    if (currentPage <= 3) pageItems = [1, 2, 3, 4, null, totalPages];
    else if (currentPage >= totalPages - 2) pageItems = [1, null, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    else pageItems = [1, null, currentPage - 1, currentPage, currentPage + 1, null, totalPages];
  }

  return (
    <div className="pagination-bar">
      <p className="pagination-summary">
        A mostrar <b>{firstItem}–{lastItem}</b> de <b>{totalItems}</b> serviços
      </p>
      <nav className="pagination-controls" aria-label="Paginação dos serviços">
        <button type="button" className="pagination-arrow" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevron_right" className="pagination-previous-icon" />
        </button>
        {pageItems.map((page, index) => page === null
          ? <span className="pagination-ellipsis" key={`ellipsis-${index}`}>…</span>
          : <button type="button" key={page} className={`pagination-page ${page === currentPage ? "current" : ""}`} aria-current={page === currentPage ? "page" : undefined} onClick={() => onPageChange(page)}>{page}</button>)}
        <button type="button" className="pagination-arrow" aria-label="Página seguinte" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          <Icon name="chevron_right" />
        </button>
      </nav>
    </div>
  );
}
