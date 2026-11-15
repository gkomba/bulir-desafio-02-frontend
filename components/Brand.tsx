import Image from "next/image";
import logoImage from "../assets/logo.png";

interface BrandProps {
  small?: boolean;
  /** O logo acima da dobra carrega logo; o do rodapé não precisa. */
  priority?: boolean;
}

export function Brand({ small = false, priority = true }: BrandProps) {
  return (
    <div className={`brand ${small ? "brand-small" : ""}`}>
      <Image className="brand-logo" src={logoImage} alt="Bulir" priority={priority} />
    </div>
  );
}
