/**
 * Manifiesto de imágenes.
 *
 * Centralizado por dos razones:
 *
 * 1. Tres imágenes siguen enlazadas en caliente a upload.wikimedia.org. Eso es
 *    un tercero en la ruta crítica y va contra la política de user-agent de
 *    Wikimedia (que de hecho bloquea la descarga automatizada: intentar
 *    autoalojarlas con curl devuelve una página de error). Hay que bajarlas a
 *    mano desde el navegador, o —mejor— sustituirlas.
 *
 * 2. Llega material fotográfico propio de Puerto Cisnes (ver
 *    BRIEF-FOTOGRAFICO.md). Cuando esté, el cambio es este archivo y nada más.
 *
 * `pending: true` marca lo que hay que reemplazar. Además, tres de las seis
 * imágenes actuales son del Parque Nacional Queulat, que no es Puerto Cisnes:
 * ese es el problema de autoría descrito en REVISION.md §10.2.
 */

export type Media = {
  src: string;
  alt: string;
  /** true = tercero remoto o lugar equivocado; sustituir en cuanto se pueda. */
  pending?: boolean;
  /** Pie visible cuando el bloque lo muestra. */
  caption?: string;
  credit?: { name: string; href: string; license: string };
};

const WIKIMEDIA = "https://upload.wikimedia.org/wikipedia/commons/thumb";

export const media = {
  heroFiordo: {
    src: "/images/cisnes-hero.webp",
    alt: "Bosque siempreverde junto a un fiordo en Puerto Cisnes al amanecer",
  },
  bosqueHelechos: {
    src: "/images/cisnes-forest.webp",
    alt: "Helechos y musgo húmedos en el sotobosque de Aysén",
  },
  aguaCanal: {
    src: "/images/cisnes-water.webp",
    alt: "Agua calma del canal Puyuhuapi rodeada de bosque siempreverde",
  },
  queulatNuboso: {
    src: `${WIKIMEDIA}/f/f0/Queulat_29.jpg/1600px-Queulat_29.jpg`,
    alt: "Bosque nuboso de hayas australes en el Parque Nacional Queulat",
    caption: "Queulat · bosque nuboso",
    pending: true,
    credit: {
      name: "LBM1948",
      href: "https://commons.wikimedia.org/wiki/File:Queulat_29.jpg",
      license: "CC BY-SA 4.0",
    },
  },
  queulatEncantado: {
    src: `${WIKIMEDIA}/0/0e/Bosque_Encantado_2_Parque_Nacional_Queulat.jpg/1600px-Bosque_Encantado_2_Parque_Nacional_Queulat.jpg`,
    alt: "Sendero del Bosque Encantado en el Parque Nacional Queulat",
    caption: "Bosque Encantado · Queulat",
    pending: true,
    credit: {
      name: "Natalia Reyes Escobar",
      href: "https://commons.wikimedia.org/wiki/File:Bosque_Encantado_2_Parque_Nacional_Queulat.jpg",
      license: "CC BY-SA 4.0",
    },
  },
  bosqueValdiviano: {
    src: `${WIKIMEDIA}/a/a9/Bosque_valdiviano.jpg/1600px-Bosque_valdiviano.jpg`,
    alt: "Copas del bosque valdiviano",
    caption: "Selva valdiviana",
    pending: true,
  },
} satisfies Record<string, Media>;

/** Origen remoto que aún hay que eliminar: se usa para el preconnect. */
export const REMOTE_IMAGE_ORIGIN = "https://upload.wikimedia.org";

export const pendingMedia = Object.entries(media)
  .filter(([, item]) => "pending" in item && item.pending)
  .map(([key]) => key);
