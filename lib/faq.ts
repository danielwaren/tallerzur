/**
 * Preguntas frecuentes: fuente única para los <details> visibles y para el
 * JSON-LD FAQPage. El markup solo es válido si corresponde a contenido que
 * la página muestra, por eso salen del mismo arreglo.
 *
 * Sin cifras a propósito (decisión de TallerZur): los precios van en la
 * cotización. TODO: rango típico de plazos cuando lo tengamos.
 */
export type Faq = { q: string; a: string };

export const FAQ: Faq[] = [
  {
    q: "¿Cuánto cuesta una página web para mi negocio?",
    a: "Depende de lo que necesites: no cuesta lo mismo una página de presentación que una tienda con pagos online. La primera conversación es gratis y la cotización te llega por escrito, con el detalle de lo que incluye, antes de empezar cualquier trabajo.",
  },
  {
    q: "¿Cuánto se demora en estar lista?",
    a: "Depende del tamaño del proyecto y de qué tan rápido tengamos tus fotos y textos. El plazo va por escrito en la cotización, para que sepas desde el principio cuándo queda en línea.",
  },
  {
    q: "¿Qué pasa si mi sitio se cae en enero, en plena temporada?",
    a: "Con la Mantención garantizada, entre diciembre y marzo lo atendemos en menos de 4 horas hábiles, y el resto del año respondemos en menos de 24 horas. Hablas por WhatsApp con quien conoce tu sitio, no con un sistema de tickets.",
  },
  {
    q: "No tengo página web, solo Instagram o WhatsApp. ¿Me sirve?",
    a: "Sí, y es el caso más común. Partimos desde cero: dominio, sitio y correo con el nombre de tu negocio. Instagram y WhatsApp siguen sirviendo, pero no aparecen cuando alguien busca en Google «hostal en Puerto Cisnes»; tu página sí.",
  },
  {
    q: "¿Atienden a negocios de toda la región?",
    a: "Sí, en las 10 comunas de Aysén: Guaitecas, Cisnes, Lago Verde, Aysén, Coyhaique, Río Ibáñez, Chile Chico, Cochrane, O'Higgins y Tortel. Trabajamos a distancia, por WhatsApp y correo, así que los kilómetros no son un problema.",
  },
  {
    q: "¿El sitio funciona con la señal de la Patagonia?",
    a: "Lo construimos liviano a propósito: imágenes comprimidas, poco código y nada que dependa de una conexión perfecta. Sabemos que tu cliente te busca desde el celular con dos barras.",
  },
];
