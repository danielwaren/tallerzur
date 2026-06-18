import { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import gsap from 'gsap';
import CursorField from './CursorField.tsx';
import 'swiper/css';
import 'swiper/css/effect-fade';

const slides = [
  {
    img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=70&w=1280&auto=format&fit=crop',
    tag: 'desarrollo web',
    text: 'Sitios que cargan rápido,\nincluso con la señal del sur.',
  },
  {
    img: 'https://images.unsplash.com/photo-1508264165352-258db2ebd59b?q=70&w=1280&auto=format&fit=crop',
    tag: 'mantenimiento',
    text: 'Tu sitio siempre arriba.\nNosotros lo cuidamos.',
  },
  {
    img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=70&w=1280&auto=format&fit=crop',
    tag: 'servicios web',
    text: 'Reservas, pagos, catálogos.\nHerramientas que venden.',
  },
];

const TYPED = 'Tu negocio en internet, hecho por alguien de aquí.';

export default function Hero() {
  const typeRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = typeRef.current;
    if (!el) return;

    if (reduced) {
      el.textContent = TYPED;
      return;
    }

    const ctx = gsap.context(() => {
      // Cursor blink, terminal style
      gsap.to(cursorRef.current, { opacity: 0, repeat: -1, yoyo: true, duration: 0.5, ease: 'steps(1)' });

      // Typing effect: the signature of the page
      const chars = TYPED.split('');
      const tl = gsap.timeline({ delay: 0.8 });
      chars.forEach((ch, i) => {
        tl.call(() => { el.textContent = TYPED.slice(0, i + 1); }, [], i * 0.045);
      });

      // Staggered reveal of UI elements
      gsap.from('[data-hero-reveal]', {
        y: 40, opacity: 0, stagger: 0.15, duration: 1, ease: 'power3.out', delay: 0.2,
      });

      // Slow ambient drift on slide overlay grid
      gsap.to('[data-grid]', { backgroundPosition: '120px 120px', duration: 30, repeat: -1, ease: 'none' });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative h-[100svh] min-h-[600px] overflow-hidden">
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop
        speed={1400}
        className="!absolute inset-0 h-full w-full"
        onSlideChange={(s) => {
          const active = s.slides[s.activeIndex];
          const caption = active?.querySelector('[data-caption]');
          if (caption) {
            gsap.fromTo(caption, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' });
          }
        }}
      >
        {slides.map((s, i) => (
          <SwiperSlide key={s.tag}>
            <div className="relative h-full w-full">
              <img
                src={s.img}
                alt={`Paisaje de Aysén — ${s.tag}`}
                className="h-full w-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/60 to-abyss/30" />
              <div data-caption className="absolute bottom-28 left-6 md:left-16 max-w-md">
                <span className="font-mono text-lima text-xs tracking-widest uppercase">// {s.tag}</span>
                <p className="mt-2 font-display text-xl md:text-2xl text-bone whitespace-pre-line">{s.text}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Ambient drifting grid overlay */}
      <div
        data-grid
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#7CFC8A 1px, transparent 1px), linear-gradient(90deg, #7CFC8A 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Interactive cursor particle field (sensible al puntero / touch / giroscopio) */}
      <div className="absolute inset-0 z-[5]">
        <CursorField />
      </div>

      {/* Main hero content */}
      <div className="relative z-10 flex h-full flex-col justify-center px-6 md:px-16 pointer-events-none">
        <p data-hero-reveal className="font-mono text-moss text-sm">~/aysen/puerto-cisnes $</p>
        <h1 data-hero-reveal className="mt-4 max-w-3xl font-display text-4xl md:text-6xl font-bold leading-tight">
          <span ref={typeRef} aria-label={TYPED}></span>
          <span ref={cursorRef} aria-hidden="true" className="text-lima">▌</span>
        </h1>
        <p data-hero-reveal className="mt-6 max-w-xl text-moss text-lg">
          Desarrollo, mantenimiento y servicios web para pymes de la Región de Aysén.
        </p>
      </div>

      {/* Scroll cue */}
      <a
        href="#manifesto"
        aria-label="Bajar"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 text-moss/70 hover:text-lima transition"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest">scroll</span>
        <span className="flex h-9 w-5 items-start justify-center rounded-full border border-moss/40 p-1">
          <span className="h-1.5 w-1 rounded-full bg-lima animate-bounce"></span>
        </span>
      </a>
    </div>
  );
}
