#!/usr/bin/env python3
"""Migración: normaliza slugs de categorías y regenera los slugs de productos
a partir de su nombre (conservando la marca de tiempo final para no romper
la unicidad). Uso: python3 scripts/fix_slugs.py [--apply]
"""
import datetime
import json
import os
import re
import sys
import unicodedata
import urllib.request

APPLY = "--apply" in sys.argv

env = {}
for line in open(os.path.join(os.path.dirname(__file__), "..", ".env.local"), encoding="utf-8"):
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()

BASE = env["NEXT_PUBLIC_SUPABASE_URL"]
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]


def req(method, path, data=None):
    r = urllib.request.Request(
        f"{BASE}/rest/v1/{path}",
        method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    with urllib.request.urlopen(r, timeout=30) as resp:
        body = resp.read().decode()
        return json.loads(body) if body else None


def slugify(t):
    t = unicodedata.normalize("NFD", str(t or ""))
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", "-", t)
    return re.sub(r"^-+|-+$", "", t) or "producto"


print("MODO:", "APLICAR" if APPLY else "SIMULACIÓN (dry-run)")
print("\n=== CATEGORÍAS ===")
cats = req("GET", "categories?select=id,name,slug&order=name")
usados = set()
for c in cats:
    nuevo = slugify(c["name"])
    while nuevo in usados:
        nuevo += "-2"
    usados.add(nuevo)
    if nuevo != c["slug"]:
        print(f"  CAMBIA  {c['name']:<24} {c['slug']:<22} -> {nuevo}")
        if APPLY:
            req("PATCH", f"categories?id=eq.{c['id']}", {"slug": nuevo})
    else:
        print(f"  ok      {c['name']:<24} {c['slug']}")

print("\n=== PRODUCTOS ===")
prods = req("GET", "products?select=id,name,slug,created_at&order=created_at")
vistos = {}
cambios = 0
for p in prods:
    m = re.search(r"-(\d{10,})$", p["slug"] or "")
    if m:
        sello = m.group(1)
    else:
        # sin marca de tiempo en el slug: la tomamos de created_at (milisegundos)
        dt = datetime.datetime.fromisoformat(p["created_at"].replace("Z", "+00:00"))
        sello = str(int(dt.timestamp() * 1000))

    base = f"{slugify(p['name'])}-{sello}"
    nuevo = base
    n = 2
    while nuevo in vistos:
        nuevo = f"{base}-{n}"
        n += 1
    vistos[nuevo] = p["id"]

    if nuevo != p["slug"]:
        cambios += 1
        print(f"  CAMBIA  {p['name'][:46]:<48}\n            {p['slug']}\n         -> {nuevo}")
        if APPLY:
            req("PATCH", f"products?id=eq.{p['id']}", {"slug": nuevo})
    else:
        print(f"  ok      {p['name'][:46]:<48} {p['slug']}")

print(f"\nResumen: {cambios} slugs de producto por corregir de {len(prods)}")
if not APPLY:
    print("(simulación: no se escribió nada. Agrega --apply para ejecutar)")
