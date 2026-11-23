import { media, type ResponsiveImage } from "@/lib/media";
import type { ServicioId } from "@/lib/contact";

/**
 * Las tres líneas de trabajo de TallerZur, con la voz específica del resto
 * del sitio — nada de "soluciones digitales de vanguardia". La foto de fondo
 * sigue siendo el paisaje: el oficio pasa por debajo, no lo reemplaza.
 */
export type Service = {
  id: Exclude<ServicioId, "asesoria">;
  number: string;
  eyebrow: string;
  title: string;
  text: string;
  includes: string[];
  forWho: string;
  cta: string;
  image: ResponsiveImage;
  tone: "forest" | "water" | "road";
  featured?: boolean;
};

export const SERVICES: Service[] = [
  {
    id: "desarrollo",
    number: "01",
    eyebrow: "Desarrollo web",
    title: "Un sitio que carga incluso con la señal del sur.",
    text: "Landing pages, sitios y tiendas a medida: livianos, rápidos y pensados para vender desde el primer día, no para ganar premios de diseño.",
    includes: [
      "Landing, sitio completo o tienda online, según lo que necesites",
      "Diseño pensado para el celular y para cargar rápido",
      "Botón de WhatsApp, mapa y formulario de contacto",
      "Lo básico para aparecer en Google cuando te buscan en tu comuna",
    ],
    forWho: "Negocios sin página web, o con una web vieja que nadie actualiza.",
    cta: "Cotizar un sitio",
    image: media.bosqueHelechos,
    tone: "forest",
  },
  {
    id: "mantencion",
    number: "02",
    eyebrow: "Mantención garantizada",
    title: "Un sitio abandonado se nota antes que uno mal hecho.",
    text: "Actualizaciones, respaldos y seguridad sin tickets eternos. Si algo falla, hablas con quien lo construyó, no con un formulario.",
    includes: [
      "Monitoreo: si el sitio se cae, nos enteramos antes que tus clientes",
      "Respaldos periódicos y restauración si algo sale mal",
      "Actualizaciones de seguridad y certificado SSL al día",
      "Cambios pequeños y soporte directo por WhatsApp",
    ],
    forWho: "Cualquier negocio que ya tiene web y no puede quedarse sin ella en temporada.",
    cta: "Quiero mantención",
    image: media.aguaCanal,
    tone: "water",
    featured: true,
  },
  {
    id: "digitales",
    number: "03",
    eyebrow: "Servicios digitales",
    title: "Reservas, catálogos y pagos, sin depender de una sola app.",
    text: "Herramientas hechas a la medida de tu operación: lo que tu negocio necesita para crecer, no una plantilla genérica con tu logo encima.",
    includes: [
      "Reservas online para hostales y cabañas",
      "Catálogo o carta digital fácil de actualizar",
      "Pagos online con los medios que ya se usan en Chile",
      "Correo con el dominio de tu negocio (hola@tunegocio.cl)",
    ],
    forWho: "Negocios que hoy reciben reservas y pedidos a mano, por WhatsApp o Instagram.",
    cta: "Cotizar una herramienta",
    image: media.heroFiordo,
    tone: "road",
  },
];

/** Promesas de la Mantención garantizada — el servicio de los correos de prospección. */
export const MAINTENANCE = {
  heading: "Si tu sitio se cae en enero, no esperas a marzo.",
  lead:
    "La temporada alta en Aysén dura pocos meses y no perdona un sitio caído. La mantención existe para que eso lo resolvamos nosotros, rápido, mientras tú atiendes a tus pasajeros.",
  guarantees: [
    { value: "< 24 h", label: "Respuesta todo el año", note: "Cualquier problema o cambio, respondido en menos de un día." },
    { value: "< 4 h", label: "Temporada alta (dic–mar)", note: "Si el sitio se cae, lo atendemos en menos de 4 horas hábiles." },
    { value: "WhatsApp", label: "Soporte directo", note: "Hablas con quien conoce tu sitio. Sin tickets ni formularios." },
    { value: "Mensual", label: "Plan a tu medida", note: "Te cotizamos según el tamaño de tu sitio. Sin letra chica." },
  ],
  cta: "Quiero mantención para mi sitio",
} as const;

export const TRUST = [
  { title: "Hecho en Puerto Cisnes", text: "Conocemos la temporada, la señal y a quien te busca." },
  { title: "Soporte por WhatsApp", text: "Hablas directo con quien hizo tu sitio." },
  { title: "Respuesta en menos de 24 h", text: "Y en menos de 4 h hábiles si se cae en temporada alta." },
  { title: "Carga con mala señal", text: "Sitios livianos, pensados para el celular con dos barras." },
] as const;
