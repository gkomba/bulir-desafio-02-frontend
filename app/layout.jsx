import "../styles/styles.css";
import "../styles/settings.css";
import "../styles/dashboard.css";
import "../styles/explore.css";
import "../styles/motion.css";
import "../styles/icons.css";
import "../styles/landing.css";

export const metadata = {
  title: "Presta-ja | Serviços perto de si",
  description: "Encontre serviços locais ou apresente o seu trabalho no Presta-ja.",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
