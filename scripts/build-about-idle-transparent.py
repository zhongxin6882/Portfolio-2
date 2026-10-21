"""Lift the existing idle illustration off its flat off-white matte.

The source RGB stays untouched; only an alpha channel is derived. This keeps
the character, lettering and fine halftone exactly as drawn in the repository.
"""

from pathlib import Path
from collections import deque
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/about/portrait-default-v2.webp"
OUTPUT = ROOT / "assets/about/portrait-idle-transparent.png"

image = Image.open(SOURCE).convert("RGBA")
width, height = image.size
rgb = image.convert("RGB").tobytes()
outside = bytearray(width * height)
queue = deque()

def is_matte(index):
    offset = index * 3
    return rgb[offset] > 242 and rgb[offset + 1] > 242 and rgb[offset + 2] > 240

def visit(index):
    if not outside[index] and is_matte(index):
        outside[index] = 1
        queue.append(index)

for x in range(width):
    visit(x)
    visit((height - 1) * width + x)
for y in range(height):
    visit(y * width)
    visit(y * width + width - 1)

while queue:
    index = queue.popleft()
    x = index % width
    if x:
        visit(index - 1)
    if x + 1 < width:
        visit(index + 1)
    if index >= width:
        visit(index - width)
    if index < width * (height - 1):
        visit(index + width)

alpha = bytearray(width * height)
for index in range(width * height):
    if outside[index]:
        continue
    offset = index * 3
    red, green, blue = rgb[offset:offset + 3]
    darkness = max(254 - red, 254 - green, 252 - blue, 0)
    y, x = divmod(index, width)
    if y < 390 or (y < 500 and x < 620):
        alpha[index] = min(255, max(0, round(darkness * 255 / 12)))
    else:
        alpha[index] = 255

image.putalpha(Image.frombytes("L", (width, height), bytes(alpha)))

image.save(OUTPUT, optimize=True)
print(f"Saved {OUTPUT.relative_to(ROOT)} ({image.width}x{image.height}, RGBA)")
