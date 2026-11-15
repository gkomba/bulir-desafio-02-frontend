import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/styles.css";
import "../styles/settings.css";
import "../styles/dashboard.css";
import "../styles/explore.css";
import "../styles/motion.css";
import "../styles/icons.css";
import "../styles/landing.css";

export const metadata: Metadata = {
  title: "Bulir | Serviços perto de si",
  description: "Encontre serviços locais ou apresente o seu trabalho na Bulir.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
