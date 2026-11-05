(() => {
  // Hero: the same rows, two outcomes
  const tabs = [...document.querySelectorAll('.switch-tabs [role="tab"]')];
  const note = document.getElementById('switch-note');
  const notes = {
    analyze: 'El mismo listado sirve para decidir o para trabajar. Prueba a cambiar de pestaña.',
    build: 'Ejemplo de herramienta: el hallazgo se convierte en una pantalla que tu equipo usa cada día.'
  };

  function select(tab) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.classList.toggle('is-on', on);
      panel.inert = !on;
      panel.setAttribute('aria-hidden', String(!on));
    });
    note.textContent = notes[tab.dataset.mode];
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      select(next);
    });
  });

  // Mini app inside the demo
  const boxes = [...document.querySelectorAll('#view-build input[type="checkbox"]')];
  const count = document.getElementById('app-count');
  const send = document.getElementById('app-send');
  function updateCount() {
    const n = boxes.filter(b => b.checked).length;
    count.textContent = n === 1 ? '1 seleccionada' : `${n} seleccionadas`;
    send.disabled = n === 0;
    send.textContent = 'Enviar recordatorio';
  }
  boxes.forEach(b => b.addEventListener('change', updateCount));
  send?.addEventListener('click', () => {
    const n = boxes.filter(b => b.checked).length;
    send.textContent = n === 1 ? 'Recordatorio enviado' : 'Recordatorios enviados';
    send.disabled = true;
    count.textContent = 'Demostración: no se envía nada';
  });

  // Contact form
  const form = document.getElementById('contact-form');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('form-status');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.className = 'form-status';
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    payload.privacidad = data.get('privacidad') === 'on';
    button.disabled = true;
    button.textContent = 'Enviando…';
    form.setAttribute('aria-busy', 'true');
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
      button.textContent = 'Enviar solicitud';
      form.removeAttribute('aria-busy');
    }
  });
})();
