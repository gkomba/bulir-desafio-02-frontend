import LandingPage from "../../modules/landing/LandingPage";

export const metadata = {
  title: "Para prestadores | Presta-ja",
  description: "Apresente os seus serviços e acompanhe a sua atividade no Presta-ja.",
};

export default function ProviderPage() {
  return <LandingPage audience="provider" />;
}
