import Image from "next/image";
import logoImage from "../assets/logo.png";

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand ${small ? "brand-small" : ""}`}>
      <Image className="brand-logo" src={logoImage} alt="Bulir" priority={!small} />
    </div>
  );
}
