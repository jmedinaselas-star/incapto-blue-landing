(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('form-status');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    payload.privacidad = data.get('privacidad') === 'on';
    button.disabled = true;
    button.textContent = 'Enviando…';
    form.setAttribute('aria-busy', 'true');
    status.className = 'form-status';
    status.textContent = '';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'No se ha podido enviar la solicitud.');
      form.reset();
      status.classList.add('is-success');
      status.textContent = 'Solicitud enviada. Te responderemos en el correo indicado.';
    } catch (error) {
      status.classList.add('is-error');
      status.textContent = `${error.message} También puedes escribir a soporte@incaptoblue.com.`;
    } finally {
      button.disabled = false;
      button.textContent = 'Solicitar análisis';
      form.removeAttribute('aria-busy');
    }
  });
})();

