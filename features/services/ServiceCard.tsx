import { money } from "../../lib/format";
import type { Service } from "../../types/domain";
import { ServiceImage } from "./ServiceImage";

export function ServiceCard({
  service,
  onClick,
}: {
  service: Service;
  onClick: () => void;
}) {
  return (
    <button className="service-card-button" onClick={onClick}>
      <div className="service-image-wrap">
        <ServiceImage service={service} />
        <span className="category-tag">{service.category}</span>
      </div>
      <div className="service-card-content">
        <div className="service-provider">
          <span className="provider-dot">{service.providerName.charAt(0)}</span>
          {service.providerName}
        </div>
        <h3>{service.title}</h3>
        <p className="service-description">{service.description}</p>
        <div className="service-card-footer">
          <strong>{money(service.price)}</strong>
        </div>
      </div>
    </button>
  );
}
