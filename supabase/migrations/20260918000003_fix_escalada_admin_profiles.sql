-- ============================================================
-- MOMENTIVA — CORRECCIÓN CRÍTICA: escalada de privilegios en `profiles`
--
-- QUÉ PASABA (verificado el 18-sep-2026):
--   Cualquier cliente registrado podía hacerse administrador con una sola petición:
--     PATCH /rest/v1/profiles?id=eq.<su_propio_id>   { "role": "admin" }
--   La política "Users can update own profile" permitía actualizar su propia fila
--   SIN limitar qué columnas, así que podía escribir `role = 'admin'` y obtener
--   acceso total al panel (pedidos de todos los clientes, precios, cupones, etc.).
--
-- CÓMO SE ARREGLA (dos capas):
--   1. Se quita el permiso de UPDATE de la tabla y se concede SOLO por columna,
--      únicamente las que el cliente edita en "Mi cuenta". Así `role` no se puede
--      escribir ni aunque la política lo permita (el permiso se revisa antes).
--   2. La política se restringe a usuarios autenticados y con WITH CHECK.
--
-- Se puede ejecutar varias veces sin daño.
-- ============================================================

-- 1) Permisos por columna: el cliente solo puede editar sus datos de contacto.
--    (La app actualiza exactamente: full_name, phone, birth_date, address)
revoke update on public.profiles from anon, authenticated;

grant update (full_name, phone, birth_date, address)
  on public.profiles
  to authenticated;

-- 2) La política se reescribe: solo autenticados, y el nuevo valor debe seguir
--    siendo su propia fila.
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users pueden actualizar su propio perfil" on public.profiles;

create policy "Users pueden actualizar su propio perfil"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3) Higiene: quitar privilegios que nadie usa y que son peligrosos si algún día
--    se alcanzan por otra vía (TRUNCATE no respeta RLS).
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- 4) Defensa en profundidad: `anon` (visitante sin sesión) no necesita escribir nada.
--    Todas las escrituras pasan por el servidor con la llave de servicio.
revoke insert, update, delete on all tables in schema public from anon;

-- ============================================================
-- CÓMO COMPROBAR QUE QUEDÓ BIEN
-- ============================================================
-- Con la sesión de un cliente normal, esto debe fallar:
--   PATCH /rest/v1/profiles?id=eq.<su_id>  { "role": "admin" }
--   -> 403 "permission denied for table profiles" (o para la columna role)
-- Y esto debe seguir funcionando:
--   PATCH /rest/v1/profiles?id=eq.<su_id>  { "full_name": "..." }
--
-- ROLLBACK (solo si hubiera que volver atrás):
-- grant update on public.profiles to anon, authenticated;
