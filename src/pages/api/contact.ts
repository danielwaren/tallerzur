export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const SERVICE_LABELS: Record<string, string> = {
  landing: 'Landing page',
  sitio: 'Sitio completo',
  tienda: 'Tienda online',
  mantenimiento: 'Mantenimiento',
  reservas: 'Sistema de reservas',
  otro: 'Otro / no sé aún',
};

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('content-type') !== 'application/json') {
    return new Response(JSON.stringify({ error: 'Invalid content type' }), { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.name) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const { name, business, service, message, email, phone } = body as Record<string, string>;
  const serviceLabel = SERVICE_LABELS[service] ?? service;

  try {
    await resend.emails.send({
      from: 'TallerZur Web <notificaciones@tallerzur.cl>',
      to: 'hola@tallerzur.cl',
      replyTo: email,
      subject: `Nuevo contacto de ${name}${business ? ` — ${business}` : ''}`,
      html: `
        <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; background: #0A0F0D; color: #E8E4DC; padding: 40px; border-radius: 12px;">
          <h1 style="color: #7CFC8A; font-size: 1.5rem; margin-bottom: 24px;">Nuevo mensaje desde tallerzur.cl</h1>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #1A2820; color: #6B7B70; font-size: 0.8rem; text-transform: uppercase;">Nombre</td><td style="padding: 10px 0; border-bottom: 1px solid #1A2820;">${name}</td></tr>
            ${business ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #1A2820; color: #6B7B70; font-size: 0.8rem; text-transform: uppercase;">Negocio</td><td style="padding: 10px 0; border-bottom: 1px solid #1A2820;">${business}</td></tr>` : ''}
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #1A2820; color: #6B7B70; font-size: 0.8rem; text-transform: uppercase;">Servicio</td><td style="padding: 10px 0; border-bottom: 1px solid #1A2820; color: #7CFC8A;">${serviceLabel}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #1A2820; color: #6B7B70; font-size: 0.8rem; text-transform: uppercase;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #1A2820;"><a href="mailto:${email}" style="color: #7CFC8A;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #1A2820; color: #6B7B70; font-size: 0.8rem; text-transform: uppercase;">WhatsApp</td><td style="padding: 10px 0; border-bottom: 1px solid #1A2820;">${phone}</td></tr>` : ''}
          </table>
          ${message ? `<div style="margin-top: 24px; padding: 20px; background: #1A2820; border-radius: 8px; border-left: 3px solid #7CFC8A;"><p style="color: #6B7B70; font-size: 0.8rem; text-transform: uppercase; margin: 0 0 8px;">Mensaje</p><p style="margin: 0; line-height: 1.6;">${message}</p></div>` : ''}
          <p style="margin-top: 32px; font-size: 0.75rem; color: #6B7B70;">Enviado desde tallerzur.cl — Puerto Cisnes, Aysén</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[contact] Resend error:', err);
    return new Response(JSON.stringify({ error: 'Send failed' }), { status: 500 });
  }
};
