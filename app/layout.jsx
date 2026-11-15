import "../core/styles.css";
import "../core/settings.css";
import "../core/dashboard.css";
import "../core/explore.css";
import "../core/motion.css";
import "../core/icons.css";
import "../core/landing.css";

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
