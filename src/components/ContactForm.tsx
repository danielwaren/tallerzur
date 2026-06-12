import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';

const ICON = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: d }} />
);

const services = [
  { id: 'landing', label: 'Landing page', icon: '<rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' },
  { id: 'sitio', label: 'Sitio completo', icon: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" stroke-width="1.7"/>' },
  { id: 'tienda', label: 'Tienda online', icon: '<path d="M5 7h14l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 7a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="1.7"/>' },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: '<path d="M14.5 6a3.5 3.5 0 0 0-4.6 4.3L4 16.2 6.8 19l5.9-5.9A3.5 3.5 0 0 0 17 8.5l-2 2-1.5-1.5 2-2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' },
  { id: 'reservas', label: 'Sistema de reservas', icon: '<rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' },
  { id: 'otro', label: 'Otro / no sé aún', icon: '<path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1 1-1.1 1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/>' },
];

type Step = 1 | 2 | 3;
type Status = 'idle' | 'sending' | 'ok' | 'error';

export default function ContactForm() {
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({
    name: '',
    business: '',
    service: '',
    message: '',
    email: '',
    phone: '',
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);

  const animateIn = () => {
    if (!stepRef.current) return;
    gsap.from(stepRef.current, {
      x: 30,
      opacity: 0,
      duration: 0.45,
      ease: 'power3.out',
    });
  };

  useEffect(() => { animateIn(); }, [step]);

  const next = () => setStep((s) => Math.min(s + 1, 3) as Step);
  const back = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const canNext1 = form.name.trim().length > 1;
  const canNext2 = form.service !== '';
  const canSubmit = form.email.trim().includes('@') || form.phone.trim().length > 7;

  const handleSubmit = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('ok');
        gsap.from('.success-msg', { scale: 0.85, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'ok') {
    return (
      <div className="success-msg text-center py-16 px-8">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-lima/10 border border-lima/30 text-lima">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h3 className="font-display text-3xl font-bold text-lima">¡Mensaje recibido!</h3>
        <p className="mt-4 text-moss text-lg max-w-sm mx-auto">
          Te respondemos desde Puerto Cisnes en menos de 24 horas. Normalmente mucho antes.
        </p>
        <a href="https://wa.me/56900000000" target="_blank" rel="noopener"
          className="mt-8 inline-block rounded-full bg-lima px-7 py-3 font-display font-medium text-abyss transition hover:scale-105">
          También puedes escribirnos por WhatsApp →
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">

      {/* Progress bar */}
      <div className="flex gap-2 mb-10">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="relative flex-1 h-1 rounded-full bg-moss/20 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-lima rounded-full transition-all duration-500"
              style={{ width: step >= s ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <div ref={stepRef}>
        {/* Step 1: Who are you */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-lima text-xs tracking-widest uppercase mb-1">paso 1 de 3</p>
              <h3 className="font-display text-2xl md:text-3xl font-bold">Cuéntanos quién eres</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-moss mb-2 uppercase tracking-widest">Tu nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoComplete="name"
                  placeholder="María González"
                  className="w-full bg-forest/40 border border-moss/30 rounded-xl px-5 py-3.5 text-bone placeholder-moss/50 focus:outline-none focus:border-lima transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-moss mb-2 uppercase tracking-widest">Tu negocio (opcional)</label>
                <input
                  type="text"
                  value={form.business}
                  onChange={e => setForm(f => ({ ...f, business: e.target.value }))}
                  placeholder="Hostal Los Alerces, Puerto Cisnes"
                  className="w-full bg-forest/40 border border-moss/30 rounded-xl px-5 py-3.5 text-bone placeholder-moss/50 focus:outline-none focus:border-lima transition-colors"
                />
              </div>
            </div>

            <button
              onClick={next}
              disabled={!canNext1}
              className="w-full rounded-xl bg-lima px-7 py-4 font-display font-medium text-abyss text-lg transition hover:shadow-[0_0_30px_rgba(124,252,138,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Step 2: What do you need */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-lima text-xs tracking-widest uppercase mb-1">paso 2 de 3</p>
              <h3 className="font-display text-2xl md:text-3xl font-bold">¿Qué necesitas?</h3>
              <p className="text-moss mt-1 text-sm">No importa si no sabes exactamente, elige lo más cercano.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => setForm(f => ({ ...f, service: s.id }))}
                  aria-pressed={form.service === s.id}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                    form.service === s.id
                      ? 'border-lima bg-lima/10 text-lima'
                      : 'border-moss/30 bg-forest/30 text-moss hover:border-moss/60 hover:text-bone'
                  }`}
                >
                  <span className="block mb-2">{ICON(s.icon)}</span>
                  <span className="font-display text-sm font-medium">{s.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={back} className="flex-1 rounded-xl border border-moss/30 px-7 py-4 font-display font-medium text-moss transition hover:border-moss/60 hover:text-bone">
                ← Volver
              </button>
              <button
                onClick={next}
                disabled={!canNext2}
                className="flex-[2] rounded-xl bg-lima px-7 py-4 font-display font-medium text-abyss transition hover:shadow-[0_0_30px_rgba(124,252,138,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact details */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-lima text-xs tracking-widest uppercase mb-1">paso 3 de 3</p>
              <h3 className="font-display text-2xl md:text-3xl font-bold">¿Cómo te contactamos?</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-moss mb-2 uppercase tracking-widest">Tu mensaje</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Cuéntanos más de tu proyecto, aunque sea un párrafo..."
                  rows={4}
                  className="w-full bg-forest/40 border border-moss/30 rounded-xl px-5 py-3.5 text-bone placeholder-moss/50 focus:outline-none focus:border-lima transition-colors resize-none"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-moss mb-2 uppercase tracking-widest">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="tu@email.cl"
                    className="w-full bg-forest/40 border border-moss/30 rounded-xl px-5 py-3.5 text-bone placeholder-moss/50 focus:outline-none focus:border-lima transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-moss mb-2 uppercase tracking-widest">WhatsApp (opcional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+56 9 ..."
                    className="w-full bg-forest/40 border border-moss/30 rounded-xl px-5 py-3.5 text-bone placeholder-moss/50 focus:outline-none focus:border-lima transition-colors"
                  />
                </div>
              </div>
            </div>

            {status === 'error' && (
              <p className="text-red-400 font-mono text-sm">Algo falló. Escríbenos directo a hola@tallerzur.cl</p>
            )}

            <div className="flex gap-3">
              <button onClick={back} className="flex-1 rounded-xl border border-moss/30 px-7 py-4 font-display font-medium text-moss transition hover:border-moss/60 hover:text-bone">
                ← Volver
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || status === 'sending'}
                className="flex-[2] rounded-xl bg-lima px-7 py-4 font-display font-medium text-abyss text-lg transition hover:shadow-[0_0_30px_rgba(124,252,138,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Enviando…' : 'Enviar mensaje ✓'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
