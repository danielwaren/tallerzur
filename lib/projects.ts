/**
 * Proyectos en producción de TallerZur.
 *
 * Agregar un proyecto = agregar un objeto aquí y su captura en
 * `public/images/proyectos/<slug>.{avif,webp}` (800×600, ver
 * scripts/build-images.mjs). Nada más.
 *
 * Rubro y "problema" están redactados a partir de lo que muestra cada sitio
 * en vivo, sin cifras ni resultados inventados. TODO: confirmar con TallerZur.
 */

export type Project = {
  slug: string;
  name: string;
  url: string;
  year: string;
  rubro: string;
  problema: string;
  stack: string[];
  /** Captura 800×600 en /images/proyectos/<slug>.{avif,webp} */
  image: { avif: string; webp: string; width: number; height: number };
};

const shot = (slug: string) => ({
  avif: `/images/proyectos/${slug}.avif`,
  webp: `/images/proyectos/${slug}.webp`,
  width: 800,
  height: 600,
});

export const PROJECTS: Project[] = [
  {
    slug: "hostalmonchito",
    name: "hostalmonchito.cl",
    url: "https://www.hostalmonchito.cl",
    year: "2025",
    rubro: "Hostal y restaurante · Puerto Cisnes",
    problema:
      "Un hostal con pensión completa que necesitaba aparecer cuando alguien busca dónde alojar en Puerto Cisnes y recibir reservas directas, sin intermediarios.",
    stack: ["Astro", "Reservas", "SEO local"],
    image: shot("hostalmonchito"),
  },
  {
    slug: "subelab",
    name: "subelab.com",
    url: "https://www.subelab.com",
    year: "2025",
    rubro: "Laboratorio de ecología submarina",
    problema:
      "Un laboratorio de investigación que necesitaba ordenar proyectos, equipo, publicaciones y galería en un sitio propio, fácil de encontrar en Google.",
    stack: ["WordPress", "Tailwind", "SEO"],
    image: shot("subelab"),
  },
  {
    slug: "nutme",
    name: "nutme.cl",
    url: "https://www.nutme.cl",
    year: "2024",
    rubro: "Ciencia y conservación marina",
    problema:
      "Un centro de investigación (Núcleo Milenio) que necesitaba mostrar su trabajo y su equipo tanto a la comunidad científica como al público general.",
    stack: ["React", "Node.js", "Diseño UX"],
    image: shot("nutme"),
  },
];
