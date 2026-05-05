import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preselección de Choferes",
  description: "Formulario conversacional para preselección de choferes"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
