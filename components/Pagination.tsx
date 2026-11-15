import { Icon } from "./Icon";

interface PaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Os números das páginas a mostrar: todos se forem poucos, e com reticências (null) se forem muitos.
const pageItems = (current: number, total: number): (number | null)[] => {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, null, total];
  if (current >= total - 2) return [1, null, total - 3, total - 2, total - 1, total];
  return [1, null, current - 1, current, current + 1, null, total];
};

export function Pagination({
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (!totalItems) return null;
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="pagination-bar">
      <p className="pagination-summary">
        A mostrar <b>{firstItem}–{lastItem}</b> de <b>{totalItems}</b> serviços
      </p>
      <nav className="pagination-controls" aria-label="Paginação dos serviços">
        <button
          type="button"
          className="pagination-arrow"
          aria-label="Página anterior"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <Icon name="chevron_right" className="pagination-previous-icon" />
        </button>
        {pageItems(currentPage, totalPages).map((page, index) =>
          page === null ? (
            <span className="pagination-ellipsis" key={`ellipsis-${index}`}>…</span>
          ) : (
            <button
              type="button"
              key={page}
              className={`pagination-page ${page === currentPage ? "current" : ""}`}
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          className="pagination-arrow"
          aria-label="Página seguinte"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <Icon name="chevron_right" />
        </button>
      </nav>
    </div>
  );
}
