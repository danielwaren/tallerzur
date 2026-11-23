import type { ResponsiveImage } from "@/lib/media";

type Props = {
  image: ResponsiveImage;
  sizes: string;
  className?: string;
  alt?: string;
  priority?: boolean;
};

/**
 * AVIF → WebP con `srcset` y dimensiones reales. Bajo el pliegue carga
 * diferida; `priority` solo para la imagen del hero (LCP).
 */
export default function Picture({ image, sizes, className, alt, priority = false }: Props) {
  return (
    <picture>
      <source type="image/avif" srcSet={image.avifSet} sizes={sizes} />
      <source type="image/webp" srcSet={image.webpSet} sizes={sizes} />
      <img
        className={className}
        src={image.src}
        alt={alt ?? image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
      />
    </picture>
  );
}
