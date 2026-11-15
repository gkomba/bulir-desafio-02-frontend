import type { Metadata } from "next";
import { LandingPage } from "../../features/landing/LandingPage";

export const metadata: Metadata = {
  title: "Para clientes | Bulir",
  description: "Explore serviços, compare preços e encontre profissionais na Bulir.",
};

export default function ClientPage() {
  return <LandingPage audience="client" />;
}
