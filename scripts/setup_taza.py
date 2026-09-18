#!/usr/bin/env python3
"""Prepara el complemento "Taza personalizada" (punto 6).

1. Crea el bucket PRIVADO `pedidos-clientes` (fotos de clientes: fotos de la taza).
2. Sube la imagen del producto al bucket público `product-images`.
3. Crea el producto en la categoría "Complementa tu regalo".

Es idempotente: si el bucket o el producto ya existen, actualiza sin duplicar.
Uso: python3 scripts/setup_taza.py
"""
import json
import mimetypes
import os
import urllib.error
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

env = {}
for linea in open(os.path.join(RAIZ, ".env.local"), encoding="utf-8"):
    linea = linea.strip()
    if linea and not linea.startswith("#") and "=" in linea:
        k, v = linea.split("=", 1)
        env[k.strip()] = v.strip()

BASE = env["NEXT_PUBLIC_SUPABASE_URL"]
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]

NOMBRE = "Taza personalizada"
SLUG = "taza-personalizada"
PRECIO = 250.0
COSTO = 100.0  # provisional: lo ajustan en el panel
CATEGORIA = "Complementa tu regalo"
BUCKET_PRIVADO = "pedidos-clientes"


def api(method, path, data=None, extra=None, raw=None, content_type=None):
    headers = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
    if raw is None and data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode()
    elif raw is not None:
        headers["Content-Type"] = content_type or "application/octet-stream"
        body = raw
    else:
        body = None
    if extra:
        headers.update(extra)
    req = urllib.request.Request(f"{BASE}{path}", method=method, data=body, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            texto = r.read().decode()
            return r.status, (json.loads(texto) if texto.strip().startswith(("{", "[")) else texto)
    except urllib.error.HTTPError as e:
        texto = e.read().decode()
        try:
            return e.code, json.loads(texto)
        except Exception:
            return e.code, texto


print("1) Bucket privado para fotos de clientes")
st, res = api("POST", "/storage/v1/bucket", {"id": BUCKET_PRIVADO, "name": BUCKET_PRIVADO, "public": False})
if st in (200, 201):
    print(f"   ✅ creado '{BUCKET_PRIVADO}' (privado)")
elif "already exists" in str(res).lower() or st == 409:
    st2, res2 = api("PUT", f"/storage/v1/bucket/{BUCKET_PRIVADO}", {"public": False})
    print(f"   ↩️  ya existía; asegurado como privado (HTTP {st2})")
else:
    print(f"   ⚠️ HTTP {st} · {str(res)[:160]}")

print("2) Imagen del producto (bucket público product-images)")
ruta_local = os.path.join(RAIZ, "public", "cup.jpg")
if os.path.exists(ruta_local):
    datos = open(ruta_local, "rb").read()
    destino = "public/taza-personalizada.jpg"
    st, res = api("POST", f"/storage/v1/object/product-images/{destino}", raw=datos,
                  content_type="image/jpeg", extra={"x-upsert": "true"})
    print(f"   {'✅ subida' if st in (200, 201) else '⚠️ HTTP ' + str(st)} · {len(datos)/1024:.0f} KB")
    url_imagen = f"{BASE}/storage/v1/object/public/product-images/{destino}"
else:
    url_imagen = None
    print("   ⚠️ no se encontró public/cup.jpg")

print("3) Categoría 'Complementa tu regalo'")
st, categorias = api("GET", "/rest/v1/categories?select=id,name,slug")
cat = next((c for c in categorias if c["slug"] == "complementa-tu-regalo"), None) if isinstance(categorias, list) else None
if not cat:
    print(f"   ⚠️ no encontrada; categorías: {[c['slug'] for c in categorias] if isinstance(categorias, list) else categorias}")
    raise SystemExit(1)
print(f"   ✅ {cat['name']} ({cat['id']})")

payload = {
    "name": NOMBRE,
    "slug": SLUG,
    "description": "Taza personalizada con tu foto favorita. Sube tu imagen, ajústala dentro de la taza y la imprimimos para acompañar tu regalo.",
    "price": PRECIO,
    "raw_cost": COSTO,
    "category_id": cat["id"],
    "images": [url_imagen] if url_imagen else [],
    "custom_options": [],
    "is_in_stock_item": True,
    "stock_quantity": 0,
    "anticipation_days": 0,
    "is_custom_cup": False,
    "is_active": False,  # no se vende suelta: se agrega desde el personalizador
}

print("4) Producto 'Taza personalizada'")
st, existentes = api("GET", f"/rest/v1/products?select=id,slug,price&slug=eq.{SLUG}")
if isinstance(existentes, list) and existentes:
    pid = existentes[0]["id"]
    st, res = api("PATCH", f"/rest/v1/products?id=eq.{pid}", payload)
    print(f"   ↩️  ya existía: actualizado (HTTP {st}) · id {pid}")
else:
    st, res = api("POST", "/rest/v1/products", payload, extra={"Prefer": "return=representation"})
    pid = res[0]["id"] if isinstance(res, list) and res else "?"
    print(f"   {'✅ creado' if st in (200, 201) else '⚠️ HTTP ' + str(st)} · id {pid}")

print("\n5) Verificación")
st, ver = api("GET", f"/rest/v1/products?select=id,name,slug,price,raw_cost,is_active,is_custom_cup,images,category:categories(name)&slug=eq.{SLUG}")
print("  ", json.dumps(ver, ensure_ascii=False, indent=2)[:600])
st, buckets = api("GET", "/storage/v1/bucket")
if isinstance(buckets, list):
    for b in buckets:
        if b.get("id") == BUCKET_PRIVADO:
            print(f"   bucket '{BUCKET_PRIVADO}' -> público: {b.get('public')}")
