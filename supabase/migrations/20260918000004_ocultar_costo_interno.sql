-- ============================================================
-- MOMENTIVA — Ocultar el COSTO INTERNO (raw_cost) a los usuarios registrados
--
-- QUÉ PASABA:
--   `raw_cost` (lo que a Momentiva le cuesta cada producto) estaba oculto para los
--   visitantes anónimos, pero CUALQUIER usuario registrado podía leerlo:
--     GET /rest/v1/products?select=name,raw_cost   (con la sesión de un cliente)
--   Con eso se pueden deducir los márgenes del negocio.
--
-- CÓMO SE ARREJA:
--   Mismo truco que con `anon`: se revoca el SELECT de tabla y se concede por
--   columna, excluyendo `raw_cost`. El panel de administración lee el costo con la
--   llave de servicio (acción `obtenerProductoParaEditar`), no desde el navegador.
--
-- Se puede ejecutar varias veces sin daño.
-- ============================================================

revoke select on public.products from authenticated;

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
) on public.products to authenticated;

-- ============================================================
-- CÓMO COMPROBAR
-- ============================================================
-- Con la sesión de un cliente normal:
--   GET /rest/v1/products?select=name,price        -> 200 (funciona)
--   GET /rest/v1/products?select=name,raw_cost     -> 401 permission denied
--
-- ROLLBACK:
-- grant select on public.products to authenticated;
