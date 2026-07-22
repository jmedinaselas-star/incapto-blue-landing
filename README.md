# Incapto Blue Landing

Landing con frontend estático y una función de contacto para Vercel.

## Páginas

- `index.html`: landing principal
- `privacidad.html`: política de privacidad
- `aviso-legal.html`: aviso legal
- `api/contact.js`: envío seguro del formulario mediante Resend

## Formulario de contacto en Vercel

1. Verifica `incaptoblue.com` en Resend y crea una API key.
2. Añade en Vercel las variables `RESEND_API_KEY`, `CONTACT_FROM` y `CONTACT_TO` descritas en `.env.example`.
3. Despliega de nuevo el proyecto.

La clave se utiliza únicamente en la función del servidor y nunca se envía al navegador.

## Publicación en GitHub Pages

GitHub Pages puede publicar las páginas, pero no ejecuta `api/contact.js`; el envío directo del formulario requiere el despliegue de Vercel.
