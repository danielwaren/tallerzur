import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site";
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

/**
 * SEO local, no genérico.
 *
 * El título y la descripción van en el idioma real de la búsqueda — "página
 * web para hostal en Coyhaique", no "soluciones digitales de vanguardia"
 * (ver src/content/blog/seo-local-como-aparecer-en-google.md del sitio
 * hermano en /tallerzur, que ya explica por qué). `keywords` casi no pesa
 * para Google desde hace años, pero sí lo leen buscadores menores y
 * directorios locales, así que se mantiene honesto y específico en vez de
 * vacío.
 */
const TITLE = "TallerZur — Desarrollo web para hostales y pymes de Aysén";
const DESCRIPTION =
  "Desarrollo web, mantenimiento y servicios digitales para hostales, " +
  "restaurantes, peluquerías y hoteles de la Región de Aysén. Hecho en " +
  "Puerto Cisnes, Patagonia chilena.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · TallerZur" },
  description: DESCRIPTION,
  applicationName: "TallerZur",
  authors: [{ name: "TallerZur" }],
  keywords: [
    "TallerZur", "desarrollo web Aysén", "diseño web Coyhaique", "página web Puerto Cisnes",
    "página web para hostal", "página web para restaurante", "página web para peluquería",
    "página web para hotel", "agencia web Patagonia", "mantenimiento web pymes",
    "SEO local Aysén", "Región de Aysén", "Chile",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITE_URL,
    siteName: "TallerZur",
    title: TITLE,
    description: DESCRIPTION,
    // TODO: exportar un JPEG 1200×630 dedicado. X/Twitter no acepta WebP.
    images: [{ url: "/images/cisnes-hero.webp", width: 1536, height: 960, alt: "Bosque siempreverde junto al agua en Puerto Cisnes, sede de TallerZur" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
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
