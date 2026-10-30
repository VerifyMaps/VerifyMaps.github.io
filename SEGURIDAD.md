# Revisión de seguridad · landing de perfiles de Google Maps

Alcance: el único archivo recibido (`index.html`). No tuve acceso al repositorio de GitHub ni a su configuración: la sección 4 hay que aplicarla a mano. Nada se publicó ni se tocó producción; los cambios están en la rama `seguridad/endurecimiento`.

## 1. Hallazgos y qué se corrigió

| # | Riesgo | Antes | Ahora |
|---|---|---|---|
| 1 | **Datos personales persistentes** (alto) | Cada tecla guardaba nombre, dirección, teléfono, Gmail, etc. en `localStorage` (sin vencimiento, sin forma de borrarlo). | Borrador en `sessionStorage` (se pierde al cerrar la pestaña) con vencimiento de 2 h. Botón **«Borrar mis datos»**. Al cargar se elimina el dato viejo de `localStorage`. Aviso de privacidad en el formulario. |
| 2 | **Sin CSP** (medio) | Cualquier script inyectado habría podido ejecutarse y leer el formulario. | CSP por `<meta>`: `default-src 'none'`, `script-src 'self'`, sin `unsafe-inline`/`unsafe-eval`, `connect-src 'none'`, `form-action 'none'`, `base-uri 'none'`, `object-src 'none'`. Para eso se movieron el CSS y los 3 scripts a `css/` y `js/` (mismo código, mismo diseño). |
| 3 | **Sumidero XSS** (bajo hoy, frágil) | El formulario se armaba con `innerHTML` y concatenación. Hoy los textos son propios, pero cualquier dato futuro sin escapar habría sido XSS. | Se arma con `createElement`/`textContent`. Ningún dato pasa por el parser HTML. |
| 4 | **Datos leídos del almacenamiento** | Se confiaba en el JSON guardado (un valor manipulado rompía la página). | Se valida forma, opciones permitidas, largos y vencimiento; lo inválido se descarta. |
| 5 | **Enlace de WhatsApp** | Sin límite de largo ni limpieza; un salto de línea podía simular otro campo del mensaje. | Se limpian caracteres de control y de dirección de texto, los saltos se colapsan a « / », tope por campo y de 3.500 caracteres en total (con aviso). `target="_blank"` ahora con `noreferrer` y `referrer: no-referrer`. |
| 6 | **Validación** | Solo "campo obligatorio". | Formato de teléfono (8–15 dígitos), emails, y rechazo de `javascript:`/`data:` en web o redes; `maxlength` en cada campo. **Es ayuda de usabilidad, no seguridad**: quien controla su navegador puede saltearla. No hay servidor que valide, así que Lucio debe leer los mensajes recibidos con criterio (enlaces sospechosos, pedidos de claves). |
| 7 | **Dependencias externas** | Ninguna: sin CDNs, fuentes ni analíticas. Solo enlaces a `wa.me` y `mailto:`. | Sin cambios. La CSP impide que se sumen sin querer. |

## 2. Qué datos viajan en el enlace de WhatsApp

El mensaje es texto prellenado en `wa.me`: lo ve WhatsApp, el historial del navegador y, luego, Lucio. No pasa por ningún servidor propio.

- **Necesarios para empezar**: nombre, rubro, dirección, teléfono (ya son obligatorios).
- **Útiles pero no imprescindibles en el primer mensaje**: horarios, descripción, servicios, atributos, web o redes del negocio.
- **Resuelto**: el formulario ya no pide Gmail, comprobante, ni los datos de verificación; esos datos se piden por el chat de WhatsApp solo cuando hacen falta, y el formulario se resumió a lo esencial.

## 3. Límites que no se pueden resolver desde GitHub Pages

- Pages no permite cabeceras HTTP: la CSP por `<meta>` no cubre `frame-ancestors` (clickjacking). El sitio no tiene sesiones ni acciones sensibles, así que el riesgo es bajo. Si hiciera falta, se resuelve poniendo Cloudflare por delante.
- Los datos de contacto públicos (teléfono y email) pueden ser recolectados por bots de spam; es una decisión de negocio.

## 4. GitHub (a aplicar por vos; no pude hacerlo desde acá)

1. **2FA en tu cuenta**: Settings → Password and authentication → Two-factor authentication. Preferí una *passkey* o llave de seguridad, y guardá los códigos de recuperación en un lugar seguro. Si el repo pasa a una organización, exigí 2FA a todos los miembros.
2. **Protección de la rama `main`** (Settings → Rules → Rulesets → New branch ruleset, o con `gh`):
   ```bash
   gh api -X PUT repos/OWNER/REPO/branches/main/protection --input - <<'JSON'
   {"required_status_checks":{"strict":true,"contexts":["tests"]},
    "enforce_admins":true,
    "required_pull_request_reviews":{"required_approving_review_count":0,"dismiss_stale_reviews":true},
    "restrictions":null,"allow_force_pushes":false,"allow_deletions":false,
    "required_conversation_resolution":true}
   JSON
   ```
   (con 0 aprobaciones igual exige Pull Request y que pasen las pruebas; si sumás colaboradores, subí a 1). Activá también «Require signed commits» si firmás.
3. **Pages**: Settings → Pages → marcar **Enforce HTTPS**; publicar solo desde `main`; si usás dominio propio, verificarlo (Verified domains) para evitar *subdomain takeover*.
4. **Secretos**: Settings → Code security → activar *Secret scanning* con *Push protection* y *Dependabot alerts*.
5. Este PR ya trae `.github/workflows/tests.yml` (permisos de solo lectura; el check se llama `tests`) y `dependabot.yml`. Recomendado: fijar las Actions por SHA de commit.

## 5. Pruebas

`npm install && npm test` (12 pruebas): CSP, ausencia de código inline y de recursos externos, `rel` de los enlaces, sumideros peligrosos, armado del enlace, inyección (`<img onerror>`, `&text=`, saltos de línea, caracteres bidi), validaciones, límite de largo, privacidad (sin `localStorage`, borrado, vencimiento, datos manipulados).

Nota: `tests/`, `package.json` y `.github/` también se publican en Pages si se despliega desde la raíz; no contienen secretos. Si no querés eso, desplegá con Actions o mové el sitio a `/docs`.

## 6. Pendiente de tu aprobación

Probar la página en un navegador real (la CSP se verificó por análisis y pruebas, no con DevTools), el punto 2 (Gmail/comprobante) ya está resuelto: el formulario no los pide, hacer el PR y recién ahí publicar.
