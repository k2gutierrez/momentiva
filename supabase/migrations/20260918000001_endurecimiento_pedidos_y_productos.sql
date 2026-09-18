-- ============================================================
-- MOMENTIVA — Endurecimiento de pedidos y productos
-- Aplicado el 17-18 de septiembre de 2026 (documentado aquí para que quede
-- versionado en el repositorio).
--
-- Qué resuelve:
--   1. Los pedidos y sus artículos dejan de ser legibles por visitantes anónimos
--      (antes cualquiera con la llave pública podía leer direcciones y teléfonos).
--   2. Los cupones dejan de ser públicos (evita enumerarlos).
--   3. El costo interno de compra (`raw_cost`) deja de ser visible para visitantes.
--
-- Se puede ejecutar varias veces sin daño.
-- ============================================================

-- 1) PEDIDOS E ITEMS: RLS activo y sin políticas públicas de escritura/lectura.
--    La web inserta los pedidos desde el servidor con la llave de servicio
--    (ver src/actions/checkout.ts), así que no necesita permisos públicos.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Crear pedidos desde el checkout" on public.orders;
drop policy if exists "Crear items de pedido" on public.order_items;

-- 2) CUPONES: dejan de ser legibles por cualquiera.
--    La validación se hace en el servidor con la llave de servicio
--    (ver validateCoupon en src/actions/checkout.ts).
drop policy if exists "Lectura publica de cupones" on public.discounts;

-- 3) PRODUCTOS: se revoca el permiso de tabla y se concede por columna,
--    excluyendo `raw_cost` (el costo interno). Postgres no permite revocar una
--    sola columna de un permiso de tabla, por eso se revoca todo y se vuelve a
--    conceder columna por columna.
revoke select on public.products from anon;

grant select (
  id,
  name,
  slug,
  description,
  price,
  images,
  category_id,
  custom_options,
  is_in_stock_item,
  stock_quantity,
  anticipation_days,
  is_custom_cup,
  is_active,
  created_at
) on public.products to anon;

-- ============================================================
-- ROLLBACK (solo si hubiera que volver atrás)
-- ============================================================
-- create policy "Crear pedidos desde el checkout" on public.orders for insert to public with check (true);
-- create policy "Crear items de pedido" on public.order_items for insert to public with check (true);
-- create policy "Lectura publica de cupones" on public.discounts for select to public using (true);
-- grant select on public.products to anon;
