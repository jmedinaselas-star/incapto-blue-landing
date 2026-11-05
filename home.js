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

  const checks = [
    { el: form.elements.nombre, msg: 'Escribe tu nombre y apellidos.' },
    { el: form.elements.empresa, msg: 'Escribe el nombre de tu empresa.' },
    { el: form.elements.email, msg: el => el.value.trim() ? 'Revisa el correo: debe tener el formato nombre@empresa.es.' : 'Escribe tu correo profesional.' },
    { el: document.getElementById('f-servicio'), group: 'servicio', msg: 'Elige en qué podemos ayudarte.' },
    { el: form.elements.privacidad, msg: 'Acepta la política de privacidad para que podamos responderte.' }
  ];

  function errorSlot(check) {
    const name = check.group || check.el.name;
    return document.getElementById(`e-${name}`);
  }

  function validate(check) {
    const valid = check.group
      ? Boolean(form.querySelector(`input[name="${check.group}"]:checked`))
      : check.el.checkValidity();
    const slot = errorSlot(check);
    slot.textContent = valid ? '' : (typeof check.msg === 'function' ? check.msg(check.el) : check.msg);
    if (valid) check.el.removeAttribute('aria-invalid');
    else check.el.setAttribute('aria-invalid', 'true');
    return valid;
  }

  checks.forEach(check => {
    const target = check.group ? check.el : check.el;
    target.addEventListener('change', () => { if (check.el.getAttribute('aria-invalid')) validate(check); });
    if (!check.group) check.el.addEventListener('blur', () => { if (check.el.value || check.el.getAttribute('aria-invalid')) validate(check); });
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.className = 'form-status';
    const failed = checks.filter(check => !validate(check));
    if (failed.length) {
      status.classList.add('is-error');
      status.textContent = failed.length === 1 ? 'Falta un dato por completar.' : `Faltan ${failed.length} datos por completar.`;
      const first = failed[0];
      (first.group ? first.el.querySelector('input') : first.el).focus();
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
