#!/usr/bin/env python3
"""Optimiza los banners del carrusel (SVG) recomprimiendo las fotos embebidas.

Los SVG del carrusel pesan ~4 MB porque llevan fotos en PNG/JPEG de 1050x1050
(y dos PNG de hasta 698 KB) que en el banner se ven a ~250 px. Este script las
reduce a 600 px y las recodifica en JPEG, sin tocar el diseño (el texto y los
corazones siguen siendo vectores).

Uso:  python3 scripts/optimizar_banners.py <carpeta_salida>
"""
import base64
import io
import os
import re
import sys

from PIL import Image

MAX_LADO = 600
CALIDAD = 82

salida = sys.argv[1] if len(sys.argv) > 1 else "/tmp/banners_optimizados"
os.makedirs(salida, exist_ok=True)


def optimizar(ruta_svg: str) -> dict:
    data = open(ruta_svg, "rb").read()
    original = len(data)
    patron = re.compile(rb'(data:image/(png|jpeg|jpg);base64,)([A-Za-z0-9+/=]+)')

    stats = {"fotos": 0, "bytes_fotos_antes": 0, "bytes_fotos_despues": 0}

    def reemplazo(m):
        prefijo, fmt, b64 = m.group(1), m.group(2), m.group(3)
        raw = base64.b64decode(b64)
        stats["bytes_fotos_antes"] += len(raw)
        try:
            im = Image.open(io.BytesIO(raw))
            im.load()
        except Exception:
            stats["bytes_fotos_despues"] += len(raw)
            return m.group(0)

        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGB")
        elif im.mode not in ("RGB", "L"):
            im = im.convert("RGB")

        im.thumbnail((MAX_LADO, MAX_LADO), Image.LANCZOS)
        buf = io.BytesIO()
        im.convert("RGB").save(buf, format="JPEG", quality=CALIDAD, optimize=True)
        nuevo = buf.getvalue()
        stats["fotos"] += 1
        stats["bytes_fotos_despues"] += len(nuevo)
        return b"data:image/jpeg;base64," + base64.b64encode(nuevo)

    data = patron.sub(reemplazo, data)
    destino = os.path.join(salida, os.path.basename(ruta_svg))
    open(destino, "wb").write(data)
    stats.update(archivo=os.path.basename(ruta_svg), antes=original, despues=len(data), destino=destino)
    return stats


if __name__ == "__main__":
    for svg in sys.argv[2:]:
        s = optimizar(svg)
        print(
            f"  {s['archivo']:<26} {s['antes']/1048576:5.2f} MB -> {s['despues']/1048576:5.2f} MB "
            f"({s['despues']/s['antes']*100:4.1f}%)  · {s['fotos']} fotos recomprimidas"
        )
