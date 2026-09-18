# 🔐 Migraciones de Supabase (RLS)

Aquí viven, **versionadas en git**, las políticas de seguridad de la base de datos.

## ¿Por qué?

Hasta ahora las políticas RLS (quién puede leer o escribir cada tabla) se
configuraban **solo en el panel de Supabase**. Eso significa que:

- nadie puede revisar en el repositorio **por qué** un dato es privado,
- un cambio accidental en el panel **no deja rastro** ni se puede comparar,
- si hay que recrear el proyecto, **no se sabe cómo estaba configurado**.

Las RLS son la **primera** capa de defensa: aunque el código tenga un error, una
política bien puesta evita que se filtren datos de clientes. Por eso se versionan.

## Cómo se trabaja de aquí en adelante

1. **Un cambio de seguridad = un archivo nuevo** en esta carpeta, con fecha:
   ```
   supabase/migrations/20260918000002_lo_que_sea.sql
   ```
2. Se aplica en **Supabase → SQL Editor** (pegar y ejecutar).
3. Se sube el archivo al repositorio en el mismo commit.

Las migraciones están escritas para poder ejecutarse **varias veces** sin daño
(`drop policy if exists` antes de `create policy`).

## Cómo refrescar este archivo (línea base)

Si alguien cambia algo en el panel y hay que reflejarlo aquí, ejecutar en el
SQL Editor y pegar el resultado:

```sql
-- 1) ¿Qué tablas tienen RLS activo?
select c.relname as tabla, c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- 2) Todas las políticas, ya en formato para pegar en una migración
select format(
  'drop policy if exists %I on %I.%I; create policy %I on %I.%I for %s to %s %s %s;',
  p.polname, n.nspname, c.relname,
  p.polname, n.nspname, c.relname,
  case p.polcmd when 'r' then 'select' when 'a' then 'insert' when 'w' then 'update' when 'd' then 'delete' else 'all' end,
  case when p.polroles = '{0}' then 'public'
       else (select string_agg(quote_ident(r.rolname), ', ') from pg_roles r where r.oid = any(p.polroles)) end,
  coalesce('using (' || pg_get_expr(p.polqual, p.polrelid) || ')', ''),
  coalesce('with check (' || pg_get_expr(p.polwithcheck, p.polrelid) || ')', '')
) as ddl
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
order by c.relname, p.polname;

-- 3) Permisos por tabla (los grants de anon/authenticated)
select grantee, table_name, string_agg(privilege_type, ', ' order by privilege_type) as permisos
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by grantee, table_name
order by table_name, grantee;

-- 4) Permisos por columna (aquí se ve el bloqueo de `raw_cost`)
select grantee, table_name, string_agg(column_name, ', ' order by column_name) as columnas
from information_schema.column_privileges
where table_schema = 'public' and grantee in ('anon', 'authenticated')
  and privilege_type = 'SELECT'
group by grantee, table_name
order by table_name, grantee;
```

> El resultado de esas consultas se pega tal cual en un archivo nuevo de
> `supabase/migrations/` y queda versionado.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `20260918000001_endurecimiento_pedidos_y_productos.sql` | El endurecimiento aplicado el 17-18 de septiembre: cierra pedidos e items a lectura pública y oculta `raw_cost` a los visitantes. |
