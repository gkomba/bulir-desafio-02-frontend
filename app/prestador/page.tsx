import type { Metadata } from "next";
import { LandingPage } from "../../features/landing/LandingPage";

export const metadata: Metadata = {
  title: "Para prestadores | Bulir",
  description: "Apresente os seus serviços e encontre novos clientes na Bulir.",
};

export default function ProviderPage() {
  return <LandingPage audience="provider" />;
}
