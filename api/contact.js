const FIELD_LIMITS = {
  sector: 40,
  nombre: 120,
  clinica: 120,
  email: 160,
  pms: 80,
  analitica: 40,
  necesidad: 2000
};

function clean(value, limit) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

function parseBody(body) {
  if (typeof body === 'string') return JSON.parse(body);
  return body || {};
}

module.exports = async function contact(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  let body;
  try {
    body = parseBody(req.body);
  } catch {
    return res.status(400).json({ error: 'La solicitud no es válida.' });
  }

  if (clean(body.website, 200)) {
    return res.status(200).json({ ok: true });
  }

  const fields = Object.fromEntries(
    Object.entries(FIELD_LIMITS).map(([name, limit]) => [name, clean(body[name], limit)])
  );
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email);
  const required = fields.nombre && fields.clinica && fields.pms && fields.analitica;

  if (!required || !validEmail || body.privacidad !== true) {
    return res.status(400).json({ error: 'Revisa los campos obligatorios y la aceptación de privacidad.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  const to = process.env.CONTACT_TO || 'soporte@incaptoblue.com';
  if (!apiKey || !from) {
    console.error('Contact form is missing RESEND_API_KEY or CONTACT_FROM.');
    return res.status(503).json({ error: 'El envío no está configurado todavía.' });
  }

  const safe = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, escapeHtml(value)]));
  const sector = fields.sector || 'Veterinaria';
  const subject = `Solicitud ${sector} · ${fields.clinica}`;
  const text = [
    `Sector: ${sector}`,
    `Nombre: ${fields.nombre}`,
    `Clínica: ${fields.clinica}`,
    `Correo: ${fields.email}`,
    `Software de gestión: ${fields.pms}`,
    `Módulo de analítica: ${fields.analitica}`,
    '',
    'Necesidad principal:',
    fields.necesidad || 'No indicada',
    '',
    'La persona ha aceptado la política de privacidad para recibir respuesta a esta solicitud.'
  ].join('\n');
  const html = `
    <h2>Nueva solicitud de muestra</h2>
    <p><strong>Sector:</strong> ${safe.sector || 'Veterinaria'}</p>
    <p><strong>Nombre:</strong> ${safe.nombre}</p>
    <p><strong>Clínica:</strong> ${safe.clinica}</p>
    <p><strong>Correo:</strong> ${safe.email}</p>
    <p><strong>Software de gestión:</strong> ${safe.pms}</p>
    <p><strong>Módulo de analítica:</strong> ${safe.analitica}</p>
    <h3>Necesidad principal</h3>
    <p>${safe.necesidad || 'No indicada'}</p>
    <hr>
    <p><small>La persona ha aceptado la política de privacidad para recibir respuesta a esta solicitud.</small></p>
  `;

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: fields.email,
        subject,
        text,
        html
      })
    });
    const resendResult = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      console.error('Resend contact error:', resendResponse.status, resendResult);
      return res.status(502).json({ error: 'No se ha podido entregar la solicitud.' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact delivery error:', error);
    return res.status(502).json({ error: 'No se ha podido entregar la solicitud.' });
  }
};
