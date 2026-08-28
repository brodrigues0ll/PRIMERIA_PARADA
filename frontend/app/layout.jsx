import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Primeira Parada",
  description: "Sistema de gestão",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
