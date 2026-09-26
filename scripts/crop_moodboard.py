"""Recorta los paneles del moodboard de KAEO y los guarda como imágenes provisionales.

    python scripts/crop_moodboard.py

Las coordenadas se midieron detectando las calles claras entre paneles del
moodboard original (1453×1469 px). Se recorta con un pequeño margen interior
para no arrastrar el borde blanco.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "images" / "moodboard" / "kaeo-moodboard.webp"
OUT = ROOT / "public" / "images"

INSET = 4

# nombre → (x0, y0, x1, y1) en píxeles del moodboard
PANELS = {
    # fila 1
    "galeria/paisaje-olivo-good-people.jpg": (699, 0, 1253, 235),
    "galeria/pilar-calmer-tomorrow.jpg": (1256, 0, 1453, 235),
    # fila 2
    "hombre-sentado-costa.jpg": (0, 240, 423, 700),
    "coleccion-camisetas-colgadas.jpg": (426, 240, 1045, 632),
    "galeria/cuello-sage-etiqueta.jpg": (1047, 240, 1453, 700),
    # fila 3
    "galeria/camiseta-doblada-good-vibes.jpg": (0, 706, 380, 1079),
    "hombre-espalda-palmera.jpg": (384, 706, 769, 1079),
    "galeria/tejido-less-hurry.jpg": (772, 706, 1040, 1079),
    "galeria/espalda-brighter-tomorrow.jpg": (1045, 706, 1453, 1079),
    # fila 4
    "galeria/cuello-sand-slow-living.jpg": (0, 1083, 396, 1403),
    "galeria/paisaje-same-sun.jpg": (399, 1083, 1007, 1403),
    "galeria/pila-camisetas-frases.jpg": (1010, 1083, 1453, 1403),
}

# Cada camiseta colgada de la barra, encuadrada en 4:5 (percha + pecho con el logo),
# para las fichas de producto "Essential Tee".
TEES = {
    "offwhite": (455, 300, 627, 515),
    "sand": (604, 330, 734, 492),
    "sage": (700, 330, 830, 492),
    "blue": (802, 330, 932, 492),
    "black": (906, 330, 1036, 492),
}


def crop(im, box, inset=INSET):
    x0, y0, x1, y1 = box
    return im.crop((x0 + inset, y0 + inset, x1 - inset, y1 - inset))


def upscale(im, factor=2):
    big = im.resize((im.width * factor, im.height * factor), Image.LANCZOS)
    return big.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))


def remove_script(im, box):
    """Borra la frase manuscrita oscura de una zona (relleno por convolución normalizada)."""
    a = np.asarray(im).astype(np.float32)
    x0, y0, x1, y1 = box
    lum = a[..., :3].mean(-1)
    local = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.MedianFilter(15))).astype(np.float32)
    mask = np.zeros(lum.shape, bool)
    mask[y0:y1, x0:x1] = (lum[y0:y1, x0:x1] < local[y0:y1, x0:x1] - 18)
    mask = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    keep = (~mask).astype(np.float32)
    out = a.copy()
    for radius in (3, 6, 12, 24):
        num = np.stack(
            [np.asarray(Image.fromarray((a[..., c] * keep).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))) for c in range(3)],
            -1,
        ).astype(np.float32)
        den = np.asarray(Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(np.float32)[..., None] / 255
        fill = num / np.maximum(den, 1e-3)
        todo = mask & (den[..., 0] > 0.15)
        out[todo] = fill[todo]
        a[todo] = fill[todo]
        keep[todo] = 1
        mask &= ~todo
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


def save(im, rel, size=None):
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(path, quality=90, optimize=True, progressive=True)
    print("  -", rel, f"{im.width}x{im.height}")


def main():
    board = Image.open(SRC).convert("RGB")
    print("Recortando moodboard...")
    for rel, box in PANELS.items():
        save(upscale(crop(board, box)), rel)

    # Hero de escritorio: el paisaje de la fila 4 sin la frase manuscrita.
    landscape = crop(board, PANELS["galeria/paisaje-same-sun.jpg"])
    clean = remove_script(landscape, (20, 15, 225, 235))
    save(upscale(clean), "hero-costa-acantilados.jpg")

    for key, box in TEES.items():
        save(upscale(board.crop(box), 3), f"productos/essential-tee-{key}.jpg")


if __name__ == "__main__":
    main()
