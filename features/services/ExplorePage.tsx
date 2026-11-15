"use client";

import { useMemo, useState } from "react";
import { Empty } from "../../components/Empty";
import { FilterSelect, type FilterOption } from "../../components/FilterSelect";
import { Icon } from "../../components/Icon";
import { Pagination } from "../../components/Pagination";
import { categories, type CategoryFilter } from "../../lib/format";
import type { Service } from "../../types/domain";
import { useApp } from "../dashboard/AppContext";
import { ServiceCard } from "./ServiceCard";
import { ServiceDetail } from "./ServiceDetail";

type Sort = "recent" | "cheap" | "expensive" | "az";

const SORTS: FilterOption<Sort>[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "cheap", label: "Menor preço" },
  { value: "expensive", label: "Maior preço" },
  { value: "az", label: "A–Z" },
];

const PAGE_SIZE = 8;

const sortServices = (services: Service[], sort: Sort): Service[] => {
  // A API já devolve os mais recentes primeiro: essa é a ordem "recentes".
  const list = [...services];
  switch (sort) {
    case "cheap":
      return list.sort((a, b) => a.price - b.price);
    case "expensive":
      return list.sort((a, b) => b.price - a.price);
    case "az":
      return list.sort((a, b) => a.title.localeCompare(b.title, "pt"));
    case "recent":
      return list;
  }
};

// O cliente: o catálogo de todos os serviços, com pesquisa, categoria, ordem e páginas.
export function ExplorePage() {
  const { services } = useApp();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [category, setCategory] = useState<CategoryFilter>("Todos");
  const [pageNumber, setPageNumber] = useState(1);
  const [selected, setSelected] = useState<Service | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sortServices(
      services.filter(
        (service) =>
          (category === "Todos" || service.category === category) &&
          `${service.title} ${service.description}`.toLowerCase().includes(term),
      ),
      sort,
    );
  }, [services, category, search, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CATÁLOGO DE SERVIÇOS</span>
          <h1>Explorar serviços</h1>
          <p>Profissionais e soluções para o seu dia a dia.</p>
        </div>
      </div>
      <div className="explore-tools">
        <div className="search-box">
          <Icon name="search" />
          <input
            placeholder="Pesquisar serviços"
            aria-label="Pesquisar serviços"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPageNumber(1);
            }}
          />
        </div>
        <FilterSelect
          label="Ordenar por"
          value={sort}
          options={SORTS}
          onChange={(value) => {
            setSort(value);
            setPageNumber(1);
          }}
        />
      </div>
      <div className="category-row">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? "selected" : ""}
            onClick={() => {
              setCategory(item);
              setPageNumber(1);
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="results-label">{filtered.length} serviços disponíveis</div>
      <div className="service-grid">
        {paged.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onClick={() => setSelected(service)}
          />
        ))}
        {!filtered.length && (
          <Empty
            title="Não encontrámos serviços"
            text="Experimente outra pesquisa ou categoria."
          />
        )}
      </div>
      <Pagination
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        currentPage={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
      />
      {selected && <ServiceDetail service={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
