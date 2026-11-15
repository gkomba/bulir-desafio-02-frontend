"use client";

import { useRef, useState } from "react";
import { Empty } from "../../components/Empty";
import { uploadImage } from "../../lib/images";
import {
  createService,
  imageAuthorization,
  removeService,
  updateService,
} from "../../lib/services";
import type { Service } from "../../types/domain";
import { useApp } from "../dashboard/AppContext";
import { ServiceCard } from "./ServiceCard";
import { ServiceDetail } from "./ServiceDetail";
import { ServiceForm, type ImageChoice, type ServiceFields } from "./ServiceForm";

// O prestador: os seus serviços, e o formulário para publicar, editar e remover.
export function MyServicesPage() {
  const { services, busy, run, confirm } = useApp();
  // O serviço em edição (null = a criar um novo) e a chave que reinicia o formulário.
  const [editing, setEditing] = useState<Service | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  // A imagem já enviada: se guardar o serviço falhar, tentar de novo não a reenvia.
  const uploaded = useRef<{ blob: Blob; url: string } | null>(null);

  const startEditing = (service: Service) => {
    setEditing(service);
    setFormKey((key) => key + 1);
  };
  const stopEditing = () => {
    setEditing(null);
    setFormKey((key) => key + 1);
    uploaded.current = null;
  };

  // Cria ou atualiza o serviço. A imagem só sai do navegador agora: vai direta ao Cloudinary com a
  // assinatura da API, e o endereço que ele devolve é o que se guarda no serviço.
  const save = async (fields: ServiceFields, image: ImageChoice) => {
    const saved = await run(
      async () => {
        let imageUrl: string | null | undefined;
        if (image.kind === "remove") imageUrl = null;
        if (image.kind === "new") {
          if (uploaded.current?.blob !== image.blob) {
            setProgress(0);
            const auth = await imageAuthorization();
            const url = await uploadImage(image.blob, auth, setProgress);
            uploaded.current = { blob: image.blob, url };
          }
          imageUrl = uploaded.current.url;
        }
        const payload = { ...fields, ...(imageUrl !== undefined && { imageUrl }) };
        if (editing) await updateService(editing.id, payload);
        else await createService(payload);
      },
      editing ? "Serviço atualizado." : "Serviço publicado.",
    );
    setProgress(null);
    if (saved) stopEditing();
  };

  const confirmRemove = (service: Service) =>
    confirm({
      title: "Remover o serviço?",
      text: (
        <>
          O serviço <b>{service.title}</b> deixa de aparecer aos clientes. Esta ação não
          pode ser desfeita.
        </>
      ),
      confirmLabel: "Remover",
      run: async () => {
        if (editing?.id === service.id) stopEditing();
        await run(() => removeService(service.id), "Serviço removido.");
      },
    });

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A SUA VITRINE</span>
          <h1>Os meus serviços</h1>
          <p>Crie e atualize os serviços que oferece.</p>
        </div>
      </div>
      <div className="provider-services-layout">
        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.id}>
              <ServiceCard service={service} onClick={() => setSelected(service)} />
              <div className="service-actions">
                <button
                  type="button"
                  className="button button-outline"
                  disabled={busy}
                  aria-label={`Editar ${service.title}`}
                  onClick={() => startEditing(service)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="button button-danger delete-service"
                  disabled={busy}
                  aria-label={`Remover ${service.title}`}
                  onClick={() => confirmRemove(service)}
                >
                  Remover
                </button>
              </div>
            </article>
          ))}
          {!services.length && (
            <Empty
              title="A sua vitrine está vazia"
              text="Adicione o seu primeiro serviço."
            />
          )}
        </div>
        <ServiceForm
          key={formKey}
          editing={editing}
          busy={busy}
          progress={progress}
          onSubmit={save}
          onCancel={stopEditing}
        />
      </div>
      {selected && <ServiceDetail service={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
