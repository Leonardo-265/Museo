# Casa Museo Malvinas — Gral. Manuel Jorge Campos

Sitio web para la casa museo: información general, historia, galería de fotos,
ubicación/contacto y sistema de reservas de visitas (particulares e instituciones),
con panel de administración propio.

## Estructura

```
index.html          → sitio público
admin.html           → panel de administración (protegido con login)
css/styles.css       → estilos
js/main.js           → lógica del sitio público
js/admin.js          → lógica del panel de administración
js/supabaseClient.js → configuración de conexión a Supabase
supabase/schema.sql  → script para crear las tablas en Supabase
```

## Paso 1 — Crear el proyecto en Supabase

1. Entrá a https://supabase.com y creá un proyecto nuevo (gratis).
2. Andá a **SQL Editor** y pegá el contenido completo de `supabase/schema.sql`. Ejecutalo.
3. Andá a **Storage** → **New bucket** → nombre `fotos` → marcá **Public bucket**.
4. Andá a **Authentication** → **Users** → **Add user** y creá tu usuario admin
   (el email y contraseña que vas a usar para entrar al panel).

## Paso 2 — Conectar el sitio con tu proyecto

1. En Supabase, andá a **Project Settings → API**.
2. Copiá el **Project URL** y la **anon public key**.
3. Abrí `js/supabaseClient.js` y reemplazá:

```js
export const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
export const SUPABASE_ANON_KEY = "TU-ANON-KEY";
```

## Paso 3 — Cargar los primeros datos

- Entrá a `admin.html`, iniciá sesión con el usuario que creaste.
- En la pestaña **Textos del sitio** completá la biografía, dirección, teléfono, etc.
- En la pestaña **Fotos** subí las primeras imágenes.

## Paso 4 — Publicar en Netlify

1. Entrá a https://app.netlify.com
2. Arrastrá la carpeta completa del proyecto a "Deploy manually" (drag & drop),
   o conectá el repositorio de GitHub si preferís actualizarlo con git.
3. Netlify te da una URL pública en segundos. Podés poner un dominio propio después
   desde **Domain settings**.

## Notas

- El formulario de reservas es público: cualquiera puede enviar una reserva,
  pero solo el admin logueado puede verlas, cambiarles el estado o borrarlas.
- Las fotos se guardan en Supabase Storage (bucket `fotos`) y se sirven públicamente.
- Todo el contenido de texto (biografía, horarios, contacto) se edita desde el panel,
  sin tocar código.
- El mapa usa un embed gratuito de Google Maps con la dirección cargada
  (Ramona Pedroza 147, General Manuel J. Campos, La Pampa).
