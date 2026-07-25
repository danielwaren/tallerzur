import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";

/**
 * Tipografía autoalojada.
 *
 * Antes: la identidad entera colgaba de `Iowan Old Style`, que solo existe en
 * macOS — el resto del mundo recibía Times New Roman. Y se descargaban Geist y
 * Geist Mono, que el CSS no usaba en ninguna parte.
 *
 * Fraunces (serif variable de display) e Inter (etiquetas en versalitas) se
 * sirven desde /fonts. NO se usa `next/font/google`: bajo vinext emite rutas
 * absolutas del sistema de archivos —url(C:/Users/.../.vinext/fonts/...)— en
 * el CSS del build, que jamás resuelven en producción. Verificado sobre el
 * artefacto compilado. Ver app/fonts.css.
 */

// TODO: sustituir por el dominio real cuando exista.
const SITE_URL = "https://bosques-puerto-cisnes.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bosques de Puerto Cisnes — Patagonia, sin prisa",
    template: "%s · Bosques de Puerto Cisnes",
  },
  description:
    "Un territorio de lluvia, fiordos y montañas en la Región de Aysén, " +
    "Patagonia chilena. Bosque siempreverde, canal Puyuhuapi y una forma más " +
    "lenta de mirar el sur.",
  applicationName: "Bosques de Puerto Cisnes",
  authors: [{ name: "Puerto Cisnes" }],
  keywords: ["Puerto Cisnes", "Aysén", "Patagonia", "Carretera Austral", "bosque siempreverde", "Chile"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITE_URL,
    siteName: "Bosques de Puerto Cisnes",
    title: "Bosques de Puerto Cisnes — Patagonia, sin prisa",
    description:
      "Un territorio de lluvia, fiordos y montañas en la Región de Aysén, Patagonia chilena.",
    // TODO: exportar un JPEG 1200×630 dedicado. X/Twitter no acepta WebP.
    images: [{ url: "/images/cisnes-hero.webp", width: 1536, height: 960, alt: "Bosque siempreverde junto al agua en Puerto Cisnes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bosques de Puerto Cisnes — Patagonia, sin prisa",
    description:
      "Un territorio de lluvia, fiordos y montañas en la Región de Aysén, Patagonia chilena.",
    images: ["/images/cisnes-hero.webp"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#090b08",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <body className="antialiased">{children}</body>
    </html>
  );
}
