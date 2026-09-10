"""アプリアイコンを生成する。実行後は削除してよい一回限りのスクリプト。"""
from PIL import Image, ImageDraw
import math
import os

BLUE = (0, 88, 163, 255)
YELLOW = (255, 218, 26, 255)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "icons")
os.makedirs(OUT_DIR, exist_ok=True)


def draw_heart(draw, cx, cy, size, color):
    # 2つの円 + 三角形でハート形を作る
    r = size * 0.28
    draw.ellipse([cx - r * 1.9, cy - r * 1.55, cx - r * 0.1, cy + r * 0.65], fill=color)
    draw.ellipse([cx + r * 0.1, cy - r * 1.55, cx + r * 1.9, cy + r * 0.65], fill=color)
    points = [
        (cx - r * 1.85, cy + r * 0.15),
        (cx + r * 1.85, cy + r * 0.15),
        (cx, cy + r * 2.35),
    ]
    draw.polygon(points, fill=color)


def make_icon(size, out_name, *, rounded=True, safe_pad=1.0):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if rounded:
        radius = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BLUE)
    else:
        draw.rectangle([0, 0, size - 1, size - 1], fill=BLUE)

    heart_size = size * 0.34 * safe_pad
    draw_heart(draw, size / 2, size / 2 + size * 0.02, heart_size, YELLOW)

    img.save(os.path.join(OUT_DIR, out_name))


make_icon(192, "icon-192.png")
make_icon(512, "icon-512.png")
make_icon(512, "icon-maskable-512.png", rounded=False, safe_pad=0.72)
make_icon(180, "apple-touch-icon.png")

print("done")
