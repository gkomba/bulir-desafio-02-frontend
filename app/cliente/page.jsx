import LandingPage from "../../modules/landing/LandingPage";

export const metadata = {
  title: "Para clientes | Presta-ja",
  description: "Explore serviços, compare preços e encontre profissionais no Presta-ja.",
};

export default function ClientPage() {
  return <LandingPage audience="client" />;
}
