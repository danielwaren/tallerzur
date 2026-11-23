"use client";

import { useEffect } from "react";
import { onFirstInteraction } from "@/lib/idle";

/**
 * Efectos de scroll de la página. No dibuja nada: solo engancha GSAP y las
 * apariciones suaves sobre el HTML que ya llegó del servidor. Si este JS no
 * carga, la página se ve completa y estática.
 */
export default function PageEffects() {
  /**
   * Apariciones suaves de los bloques comerciales. La clase `js-reveal` solo
   * se pone con JS y sin reduced-motion: sin ella, todo está visible desde el
   * primer pintado.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    // Lo que ya está en pantalla al cargar no se esconde.
    const fold = window.innerHeight;
    items.forEach((item) => {
      if (item.getBoundingClientRect().top < fold) item.classList.add("is-in");
      else observer.observe(item);
    });
    root.classList.add("js-reveal");
    return () => { observer.disconnect(); root.classList.remove("js-reveal"); };
  }, []);

  /**
   * Scrubs con GSAP solo si el usuario no pidió menos movimiento, y recién en
   * la primera interacción (scroll, toque, tecla): los scrubs solo existen al
   * desplazarse, y en la posición inicial la página se ve idéntica con o sin
   * GSAP. Así sus ~110 KB no compiten con la carga.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let revert: (() => void) | null = null;

    const cancelStart = onFirstInteraction(() => {
      void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
        .then(([gsapModule, scrollModule]) => {
          if (cancelled) return;
          const gsap = gsapModule.gsap;
          const ScrollTrigger = scrollModule.ScrollTrigger;
          gsap.registerPlugin(ScrollTrigger);
          const ctx = gsap.context(() => {
            const hero = gsap.timeline({
              scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .6 },
            });
            hero
              .fromTo(".hero-image", { scale: 1.1, yPercent: -3 }, { scale: 1.02, yPercent: 5, duration: 1, ease: "none" }, 0)
              .to(".hero-copy", { yPercent: -10, opacity: 0, duration: .45, ease: "power1.in" }, .3)
              .to(".hero-bottom", { opacity: 0, y: -20, duration: .3, ease: "power1.in" }, .2)
              .to(".hero-dark", { opacity: .85, duration: .6, ease: "none" }, .4);

            const panels = gsap.utils.toArray<HTMLElement>(".project-panel");
            panels.forEach((panel, index) => {
              gsap.fromTo(panel.querySelector("img"), { scale: 1.12, yPercent: -4 }, {
                scale: 1.02, yPercent: 4, ease: "none",
                scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: .8 },
              });
              if (index < panels.length - 1) {
                // Sin `blur`: el oscurecido solo ya da la profundidad y se
                // compone barato en GPU.
                gsap.fromTo(panel.querySelector(".project-inner"), {
                  scale: 1, opacity: 1, filter: "brightness(1)",
                }, {
                  scale: .975, opacity: .92, filter: "brightness(.8)", ease: "none",
                  scrollTrigger: { trigger: panels[index + 1], start: "top bottom", end: "top top", scrub: .8 },
                });
              }
            });

            gsap.timeline({
              scrollTrigger: { trigger: ".company", start: "top bottom", end: "bottom bottom", scrub: .7 },
            })
              .fromTo(".company-bg", { opacity: .2, scale: 1.04 }, { opacity: 1, scale: 1, ease: "none" }, 0)
              .fromTo(".company-bg img", { scale: 1.12, yPercent: -5 }, { scale: 1.02, yPercent: 3, ease: "none" }, 0)
              .fromTo(".company-emblem", { opacity: 0, scale: .85, rotate: -6 }, { opacity: 1, scale: 1, rotate: 0, ease: "power2.out" }, .1);
          }, document.querySelector(".site") ?? undefined);
          revert = () => ctx.revert();
        })
        .catch(() => {
          // Si el chunk de GSAP no carga, el sitio se queda estático pero entero.
          document.documentElement.classList.add("motion-unavailable");
        });
    });

    return () => { cancelled = true; cancelStart(); revert?.(); };
  }, []);

  return null;
}
