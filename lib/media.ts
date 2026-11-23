/**
 * Manifiesto de imágenes.
 *
 * Todo es autoalojado: ya no hay fotos enlazadas en caliente a Wikimedia ni
 * capturas pedidas en vivo a mshots. Cada imagen tiene AVIF + WebP en dos
 * anchos y sus dimensiones reales, para que el navegador reserve el espacio
 * (sin saltos de layout) y elija el archivo más liviano que soporte.
 *
 * Se generan con `node scripts/build-images.mjs <capturas>` a partir de los
 * originales `public/images/cisnes-*.webp`. Cuando llegue material propio de
 * Puerto Cisnes (BRIEF-FOTOGRAFICO.md), se reemplazan esos originales y se
 * vuelve a correr el script.
 */

export type ResponsiveImage = {
  /** WebP más grande: fallback del <img>. */
  src: string;
  avifSet: string;
  webpSet: string;
  width: number;
  height: number;
  alt: string;
};

const set = (name: string, widths: number[], ext: "avif" | "webp") =>
  widths.map((w) => `/images/${name}-${w}.${ext} ${w}w`).join(", ");

const responsive = (name: string, widths: number[], width: number, height: number, alt: string): ResponsiveImage => ({
  src: `/images/${name}-${widths[widths.length - 1]}.webp`,
  avifSet: set(name, widths, "avif"),
  webpSet: set(name, widths, "webp"),
  width,
  height,
  alt,
});

export const media = {
  heroFiordo: responsive("hero", [768, 1536], 1536, 960,
    "Bosque siempreverde junto a un fiordo en Puerto Cisnes al amanecer"),
  bosqueHelechos: responsive("forest", [720, 960, 1122], 1122, 1402,
    "Helechos y musgo húmedos en el sotobosque de Aysén"),
  aguaCanal: responsive("water", [768, 1536], 1536, 1024,
    "Agua calma del canal Puyuhuapi rodeada de bosque siempreverde"),
} satisfies Record<string, ResponsiveImage>;

/** OG/Twitter: JPEG 1200×630 (X no acepta WebP). */
export const OG_IMAGE = {
  url: "/images/og-tallerzur.jpg",
  width: 1200,
  height: 630,
  alt: "TallerZur: sitios web y mantención para hostales, restaurantes y pymes de Aysén",
};
