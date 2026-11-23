import { SITE_URL } from "@/lib/site";
import { AYSEN_COMUNAS, CONTACT_EMAIL, WHATSAPP_NUMBER } from "@/lib/contact";
import { SERVICES } from "@/lib/services";
import { FAQ } from "@/lib/faq";
import { OG_IMAGE } from "@/lib/media";

/**
 * Coordenadas de Puerto Cisnes.
 *
 * Las anteriores (45°24'06" S) correspondían a Puerto Aysén, unos 70 km al sur.
 * TODO: confirmar contra fuente oficial (IGM / BCN) antes de publicar.
 */
export const COORDS = {
  label: { lat: "44°44′24″ S", lon: "72°41′48″ O" },
  short: "44°44′ S",
  decimal: { lat: -44.74, lon: -72.6967 },
};

export const SITE_TITLE = "TallerZur — Sitios web y mantención para pymes de Aysén";
export const SITE_DESCRIPTION =
  "Sitios web, mantención garantizada y herramientas digitales para hostales, " +
  "cabañas, restaurantes y pymes de las 10 comunas de Aysén. Hecho en Puerto " +
  "Cisnes, soporte por WhatsApp y respuesta en menos de 24 h.";

/**
 * Sin `priceRange`: el sitio no publica cifras (los precios van en la
 * cotización), y el JSON-LD no puede decir algo que la página no dice.
 */
export function professionalServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#tallerzur`,
    name: "TallerZur",
    url: SITE_URL,
    image: `${SITE_URL}${OG_IMAGE.url}`,
    description: SITE_DESCRIPTION,
    email: CONTACT_EMAIL,
    telephone: `+${WHATSAPP_NUMBER}`,
    areaServed: [
      { "@type": "AdministrativeArea", name: "Región de Aysén del General Carlos Ibáñez del Campo" },
      ...AYSEN_COMUNAS.map((name) => ({ "@type": "AdministrativeArea", name: `Comuna de ${name}` })),
    ],
    geo: { "@type": "GeoCoordinates", latitude: COORDS.decimal.lat, longitude: COORDS.decimal.lon },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Puerto Cisnes",
      addressRegion: "Región de Aysén",
      addressCountry: "CL",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: `+${WHATSAPP_NUMBER}`,
      email: CONTACT_EMAIL,
      availableLanguage: "es",
      areaServed: "CL",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de TallerZur",
      itemListElement: SERVICES.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.eyebrow,
          description: `${service.text} Incluye: ${service.includes.join("; ")}.`,
          areaServed: "Región de Aysén, Chile",
          provider: { "@id": `${SITE_URL}/#tallerzur` },
        },
      })),
    },
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
