"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { FilterSelect, type FilterOption } from "../../components/FilterSelect";
import { Icon } from "../../components/Icon";
import { assetUrl, errorMessage } from "../../lib/api";
import { categories } from "../../lib/format";
import { prepareImage } from "../../lib/images";
import type { CategoryLabel, Service, ServiceInput } from "../../types/domain";

const CATEGORY_OPTIONS: FilterOption<CategoryLabel>[] = categories
  .filter((item): item is CategoryLabel => item !== "Todos")
  .map((item) => ({ value: item, label: item }));

/**
 * O que fazer à imagem do serviço ao guardar: deixá-la como está, tirá-la, ou pôr uma nova (já
 * comprimida, com o endereço temporário da pré-visualização).
 */
export type ImageChoice =
  | { kind: "keep" }
  | { kind: "remove" }
  | { kind: "new"; blob: Blob; url: string };

/** Os campos do formulário. A imagem vai à parte, em `ImageChoice`. */
export type ServiceFields = Omit<ServiceInput, "imageUrl">;

interface ServiceFormProps {
  /** O serviço em edição; sem ele, o formulário cria um novo. */
  editing: Service | null;
  busy: boolean;
  /** O progresso do envio da imagem (0 a 1), ou null se não há envio. */
  progress: number | null;
  onSubmit: (fields: ServiceFields, image: ImageChoice) => void;
  onCancel: () => void;
}

// Criar e editar um serviço (o mesmo formulário). Quem o usa dá-lhe uma `key` diferente para cada
// serviço editado, para os campos recomeçarem. A imagem só sai do navegador ao guardar: é
// reduzida e comprimida aqui e devolvida em `onSubmit` para quem guarda a enviar.
export function ServiceForm({ editing, busy, progress, onSubmit, onCancel }: ServiceFormProps) {
  const [category, setCategory] = useState<CategoryLabel>(editing?.category ?? "Casa");
  const [image, setImage] = useState<ImageChoice>({ kind: "keep" });
  const [imageError, setImageError] = useState("");
  const [preparing, setPreparing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Ao editar, o formulário pode estar fora do ecrã: leva-se o foco para o título.
  useEffect(() => {
    if (editing) titleInput.current?.focus();
  }, [editing]);

  // Liberta o endereço temporário da pré-visualização ao trocar de imagem e ao sair.
  useEffect(() => {
    const url = image.kind === "new" ? image.url : "";
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [image]);

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImageError("");
    setPreparing(true);
    try {
      const blob = await prepareImage(file);
      // Se o formulário já foi fechado (outro serviço em edição, ou cancelar), o endereço
      // temporário nunca seria libertado.
      if (!mounted.current) return;
      setImage({ kind: "new", blob, url: URL.createObjectURL(blob) });
    } catch (e) {
      if (mounted.current) setImageError(errorMessage(e));
    } finally {
      if (mounted.current) setPreparing(false);
    }
  };

  const shownImage =
    image.kind === "new"
      ? image.url
      : image.kind === "keep"
        ? assetUrl(editing?.imageUrl)
        : "";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit(
      {
        title: String(form.get("title")),
        description: String(form.get("description")),
        price: Number(String(form.get("price")).replace(",", ".")),
        category,
      },
      image,
    );
  };

  return (
    <form className="panel create-form" onSubmit={submit}>
      <span className="eyebrow">{editing ? "EDITAR SERVIÇO" : "NOVO SERVIÇO"}</span>
      <h2>{editing ? "Atualizar serviço" : "Publicar serviço"}</h2>
      <label>
        Título
        <input
          ref={titleInput}
          name="title"
          required
          minLength={3}
          maxLength={80}
          defaultValue={editing?.title}
          placeholder="Ex.: Canalização residencial"
        />
      </label>
      <div className="create-filter-field">
        <span>Categoria</span>
        <FilterSelect
          name="category"
          label="Categoria"
          value={category}
          onChange={setCategory}
          options={CATEGORY_OPTIONS}
        />
      </div>
      <label>
        Descrição
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={500}
          rows={4}
          defaultValue={editing?.description}
          placeholder="Descreva o serviço que oferece"
        />
      </label>
      <label>
        Preço em Kz
        <input
          name="price"
          type="number"
          required
          min={1}
          max={10000000}
          step="any"
          defaultValue={editing?.price}
          placeholder="Ex.: 8 000"
        />
      </label>
      <div className="image-field">
        <span>Imagem</span>
        <div className="image-field-row">
          <div className="image-field-preview">
            {shownImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shownImage}
                alt={
                  editing
                    ? `Imagem do serviço ${editing.title}`
                    : "Pré-visualização da imagem do serviço"
                }
              />
            ) : (
              <Icon name="image" />
            )}
          </div>
          <div className="image-field-actions">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pick}
              hidden
            />
            <button
              type="button"
              className="button button-outline"
              disabled={busy || preparing}
              onClick={() => fileInput.current?.click()}
            >
              {preparing
                ? "A preparar…"
                : shownImage
                  ? "Mudar imagem"
                  : "Escolher imagem"}
            </button>
            {shownImage && (
              <button
                type="button"
                className="button button-outline"
                disabled={busy || preparing}
                onClick={() => setImage({ kind: "remove" })}
              >
                Tirar imagem
              </button>
            )}
            {image.kind === "new" && (
              <small role="status">
                Pronta a enviar ({Math.round(image.blob.size / 1000)} KB)
              </small>
            )}
            {imageError && (
              <small className="image-field-error" role="alert">
                {imageError}
              </small>
            )}
            {progress !== null && (
              <small role="status">A enviar a imagem… {Math.round(progress * 100)}%</small>
            )}
          </div>
        </div>
      </div>
      <button className="button button-primary button-wide" disabled={busy || preparing}>
        {progress !== null
          ? `A enviar a imagem… ${Math.round(progress * 100)}%`
          : editing
            ? "Guardar alterações"
            : "Publicar serviço"}{" "}
        <Icon name="arrow_forward" className="button-icon" />
      </button>
      {editing && (
        <button
          type="button"
          className="button button-outline button-wide"
          disabled={busy}
          onClick={onCancel}
        >
          Cancelar edição
        </button>
      )}
    </form>
  );
}
