import sharp from 'sharp';

const W = 1200, H = 630;

// Subtle grid lines
let grid = '';
for (let x = 0; x <= W; x += 48) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#7CFC8A" stroke-opacity="0.04" stroke-width="1"/>`;
for (let y = 0; y <= H; y += 48) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#7CFC8A" stroke-opacity="0.04" stroke-width="1"/>`;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="78%" cy="18%" r="65%">
      <stop offset="0%" stop-color="#7CFC8A" stop-opacity="0.22"/>
      <stop offset="55%" stop-color="#2D5A3D" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#0A0F0D" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0A0F0D"/>
      <stop offset="100%" stop-color="#0E1512"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${grid}
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- accent bar -->
  <rect x="80" y="150" width="56" height="6" rx="3" fill="#7CFC8A"/>

  <!-- terminal prompt -->
  <text x="80" y="135" font-family="Consolas, 'Courier New', monospace" font-size="26" fill="#7CFC8A" letter-spacing="2">~/aysen/puerto-cisnes $</text>

  <!-- wordmark -->
  <text x="76" y="320" font-family="Arial, 'Segoe UI', sans-serif" font-size="130" font-weight="800" letter-spacing="-3">
    <tspan fill="#E8E4DC">Taller</tspan><tspan fill="#7CFC8A">Zur</tspan>
  </text>

  <!-- tagline -->
  <text x="80" y="400" font-family="Arial, 'Segoe UI', sans-serif" font-size="42" font-weight="600" fill="#E8E4DC">Desarrollo web para pymes de la Patagonia.</text>
  <text x="80" y="452" font-family="Arial, 'Segoe UI', sans-serif" font-size="34" font-weight="400" fill="#6B7B70">Sitios, mantenimiento y servicios digitales — Región de Aysén.</text>

  <!-- footer chips -->
  <g font-family="Consolas, 'Courier New', monospace" font-size="24" fill="#7CFC8A">
    <rect x="80" y="520" width="240" height="48" rx="24" fill="#7CFC8A" fill-opacity="0.08" stroke="#7CFC8A" stroke-opacity="0.35"/>
    <text x="108" y="551">Puerto Cisnes, CL</text>
    <rect x="340" y="520" width="180" height="48" rx="24" fill="#7CFC8A" fill-opacity="0.08" stroke="#7CFC8A" stroke-opacity="0.35"/>
    <text x="368" y="551">tallerzur.cl</text>
  </g>

  <!-- decorative ring -->
  <circle cx="1010" cy="300" r="150" fill="none" stroke="#7CFC8A" stroke-opacity="0.12" stroke-width="2"/>
  <circle cx="1010" cy="300" r="96" fill="none" stroke="#7CFC8A" stroke-opacity="0.18" stroke-width="2"/>
  <circle cx="1010" cy="300" r="10" fill="#7CFC8A"/>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile('public/og-cover.jpg');
const meta = await sharp('public/og-cover.jpg').metadata();
console.log(`OG creada: ${meta.width}x${meta.height} ${meta.format}`);
