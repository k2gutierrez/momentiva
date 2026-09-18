-- ============================================================
-- MOMENTIVA — Políticas RLS y permisos tal como estaban el 18-sep-2026
--
-- Este archivo es la LÍNEA BASE: refleja lo que había en el panel de Supabase
-- cuando se versionó por primera vez (punto 4 de la auditoría). Sirve para
-- reconstruir la seguridad desde cero y para comparar cambios futuros.
--
-- NO hace falta ejecutarlo: la base ya está así. Los archivos 0001, 0003 y 0004
-- contienen los cambios aplicados.
--
-- Las 12 tablas tienen RLS activo: blocked_dates, categories, delivery_zones,
-- discounts, homepage_carousel, instagram_feed, order_items, orders, products,
-- profiles, reviews y wishlist.
-- ============================================================

-- ── blocked_dates ─────────────────────────────────────────────
drop policy if exists "Lectura publica de fechas bloqueadas" on public.blocked_dates;
create policy "Lectura publica de fechas bloqueadas" on public.blocked_dates for select to public using (true);

drop policy if exists "Admin gestiona fechas bloqueadas" on public.blocked_dates;
create policy "Admin gestiona fechas bloqueadas" on public.blocked_dates for all to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

-- ── categories ────────────────────────────────────────────────
drop policy if exists "Permitir lectura publica de categorias" on public.categories;
create policy "Permitir lectura publica de categorias" on public.categories for select to public using (true);

drop policy if exists "Permitir crear categorias a administradores" on public.categories;
create policy "Permitir crear categorias a administradores" on public.categories for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Permitir editar categorias a administradores" on public.categories;
create policy "Permitir editar categorias a administradores" on public.categories for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Permitir eliminar categorias a administradores" on public.categories;
create policy "Permitir eliminar categorias a administradores" on public.categories for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

-- ── delivery_zones ────────────────────────────────────────────
drop policy if exists "Permitir lectura publica de zonas" on public.delivery_zones;
create policy "Permitir lectura publica de zonas" on public.delivery_zones for select to public using (true);

drop policy if exists "Permitir admin crear zonas" on public.delivery_zones;
create policy "Permitir admin crear zonas" on public.delivery_zones for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Permitir admin actualizar zonas" on public.delivery_zones;
create policy "Permitir admin actualizar zonas" on public.delivery_zones for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Permitir admin eliminar zonas" on public.delivery_zones;
create policy "Permitir admin eliminar zonas" on public.delivery_zones for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

-- ── discounts (solo administradores) ──────────────────────────
drop policy if exists "Admin gestiona cupones" on public.discounts;
create policy "Admin gestiona cupones" on public.discounts for all to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

-- ── homepage_carousel ─────────────────────────────────────────
drop policy if exists "Permitir lectura publica del carrusel" on public.homepage_carousel;
create policy "Permitir lectura publica del carrusel" on public.homepage_carousel for select to public using (true);

drop policy if exists "Permitir crear carrusel a administradores" on public.homepage_carousel;
create policy "Permitir crear carrusel a administradores" on public.homepage_carousel for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Permitir editar carrusel a administradores" on public.homepage_carousel;
create policy "Permitir editar carrusel a administradores" on public.homepage_carousel for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Permitir eliminar carrusel a administradores" on public.homepage_carousel;
create policy "Permitir eliminar carrusel a administradores" on public.homepage_carousel for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

-- ── instagram_feed ────────────────────────────────────────────
drop policy if exists "Permitir lectura publica del feed" on public.instagram_feed;
create policy "Permitir lectura publica del feed" on public.instagram_feed for select to public using (true);

drop policy if exists "Permitir admin insertar" on public.instagram_feed;
create policy "Permitir admin insertar" on public.instagram_feed for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Permitir admin actualizar" on public.instagram_feed;
create policy "Permitir admin actualizar" on public.instagram_feed for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Permitir admin eliminar" on public.instagram_feed;
create policy "Permitir admin eliminar" on public.instagram_feed for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

-- ── orders ────────────────────────────────────────────────────
-- SIN política de INSERT: los pedidos los crea el servidor con la llave de servicio.
drop policy if exists "Cliente ve sus pedidos" on public.orders;
create policy "Cliente ve sus pedidos" on public.orders for select to authenticated using (client_id = auth.uid());

drop policy if exists "Admin ve pedidos" on public.orders;
create policy "Admin ve pedidos" on public.orders for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Admin actualiza pedidos" on public.orders;
create policy "Admin actualiza pedidos" on public.orders for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Admin elimina pedidos" on public.orders;
create policy "Admin elimina pedidos" on public.orders for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

-- ── order_items ───────────────────────────────────────────────
-- SIN política de INSERT: los crea el servidor con la llave de servicio.
drop policy if exists "Cliente ve sus items" on public.order_items;
create policy "Cliente ve sus items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.client_id = auth.uid()));

drop policy if exists "Admin ve items" on public.order_items;
create policy "Admin ve items" on public.order_items for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

-- ── products ──────────────────────────────────────────────────
drop policy if exists "Permitir lectura publica de productos" on public.products;
create policy "Permitir lectura publica de productos" on public.products for select to public using (true);

drop policy if exists "Permitir admin crear productos" on public.products;
create policy "Permitir admin crear productos" on public.products for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Permitir admin actualizar productos" on public.products;
create policy "Permitir admin actualizar productos" on public.products for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

drop policy if exists "Permitir admin eliminar productos" on public.products;
create policy "Permitir admin eliminar productos" on public.products for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'::user_role));

-- ── profiles ──────────────────────────────────────────────────
-- ⚠️ Esta política era la que permitía la ESCALADA A ADMIN. El arreglo está en
-- la migración 20260918000003; aquí se deja la versión corregida.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to public using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users pueden actualizar su propio perfil" on public.profiles;
create policy "Users pueden actualizar su propio perfil" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ── reviews y wishlist ────────────────────────────────────────
-- RLS activo y SIN políticas: solo el servidor (llave de servicio) accede.
-- Habrá que agregarlas cuando se construyan esas funciones.
