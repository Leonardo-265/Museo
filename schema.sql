-- =========================================================
-- Casa Museo Malvinas - Gral. Manuel Jorge Campos
-- Esquema de base de datos para Supabase (PostgreSQL)
-- =========================================================

-- ---------- TABLA: fotos ----------
create table if not exists fotos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  titulo text,
  categoria text not null default 'casa' check (categoria in ('casa','objetos','documentos','eventos','otros')),
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

-- ---------- TABLA: reservas ----------
create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('particular','institucion')),

  -- comunes
  nombre text not null,
  telefono text not null,
  email text,
  cantidad_personas int not null default 1,
  fecha_propuesta date,
  horario text,
  como_se_entero text,
  comentarios text,

  -- particular
  dni text,

  -- institucion
  tipo_institucion text,
  contacto_nombre text,
  contacto_cargo text,
  rango_edad text,
  objetivo_visita text,
  accesibilidad text,

  estado text not null default 'pendiente' check (estado in ('pendiente','confirmada','rechazada')),
  creado_en timestamptz not null default now()
);

-- ---------- TABLA: contenido (textos editables) ----------
create table if not exists contenido (
  clave text primary key,
  valor text not null,
  actualizado_en timestamptz not null default now()
);

-- Valores iniciales sugeridos
insert into contenido (clave, valor) values
  ('biografia', 'Escribí acá la historia del General Manuel Jorge Campos: su vida, su participación en la Guerra de Malvinas y el origen de la casa museo.'),
  ('direccion', 'Ramona Pedroza 147, General Manuel J. Campos, La Pampa'),
  ('telefono', ''),
  ('email', ''),
  ('horarios', 'Martes a domingo de 10 a 18 hs'),
  ('cita_destacada', 'La memoria de un veterano, transformada en historia viva para su pueblo.'),
  ('portada', '')
on conflict (clave) do nothing;

-- =========================================================
-- SEGURIDAD (Row Level Security)
-- =========================================================

alter table fotos enable row level security;
alter table reservas enable row level security;
alter table contenido enable row level security;

-- Lectura pública de fotos y contenido (para el sitio público)
create policy "fotos_lectura_publica" on fotos for select using (true);
create policy "contenido_lectura_publica" on contenido for select using (true);

-- Cualquiera puede crear una reserva (formulario público), pero no leerlas
create policy "reservas_insertar_publico" on reservas for insert with check (true);

-- Solo usuarios autenticados (admin) pueden ver/editar/borrar
create policy "fotos_admin_todo" on fotos for all using (auth.role() = 'authenticated');
create policy "reservas_admin_leer" on reservas for select using (auth.role() = 'authenticated');
create policy "reservas_admin_actualizar" on reservas for update using (auth.role() = 'authenticated');
create policy "reservas_admin_borrar" on reservas for delete using (auth.role() = 'authenticated');
create policy "contenido_admin_editar" on contenido for update using (auth.role() = 'authenticated');
create policy "contenido_admin_insertar" on contenido for insert with check (auth.role() = 'authenticated');

-- =========================================================
-- STORAGE
-- =========================================================
-- 1) Crear manualmente en Supabase:
--    Storage > New bucket > nombre: "fotos" > marcar como "Public bucket"
-- 2) Ejecutar las políticas de abajo (sin esto la subida falla con error de permisos):

create policy "fotos_lectura_publica_storage"
on storage.objects for select
using ( bucket_id = 'fotos' );

create policy "fotos_subida_admin"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'fotos' );

create policy "fotos_borrado_admin"
on storage.objects for delete
to authenticated
using ( bucket_id = 'fotos' );
