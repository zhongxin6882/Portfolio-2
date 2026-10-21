"""Build pixel-aligned 24-frame About sprites from the original composition.

The reference PNGs are visual guides only. Frame zero is copied directly from
portrait-elements-hd.webp; every rectangle is returned to the same coordinates.
"""

from math import cos, pi, sin
from pathlib import Path
from collections import deque
from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "about"
SOURCE = Image.open(ASSETS / "portrait-elements-hd.webp").convert("RGBA")
OUT = ASSETS / "sprites"
OUT.mkdir(exist_ok=True)

# Non-overlapping source rectangles in the original 1324 × 1188 composition.
REGIONS = {
    "ball": (80, 180, 550, 470),
    "coffee": (550, 105, 745, 370),
    "tablet": (745, 170, 1324, 545),
    "gamepad": (80, 540, 430, 850),
    "cat": (790, 545, 1040, 760),
    "watch": (1040, 545, 1324, 780),
    "plant": (870, 780, 1260, 1100),
    "paper": (70, 850, 390, 1080),
}


def local(name, box):
    x0, y0, _, _ = REGIONS[name]
    x1, y1, x2, y2 = box
    return x1 - x0, y1 - y0, x2 - x0, y2 - y0


def extracted(frame, box, mask_shape="ellipse"):
    """Return a layer cut from a subregion and the cleared background."""
    mask = Image.new("L", frame.size)
    draw = ImageDraw.Draw(mask)
    if mask_shape == "ellipse":
        draw.ellipse(box, fill=255)
    else:
        draw.polygon(box, fill=255)
    layer = frame.copy()
    layer.putalpha(ImageChops.multiply(frame.getchannel("A"), mask))
    cleared = frame.copy()
    cleared.paste((0, 0, 0, 0), (0, 0, frame.width, frame.height), mask)
    return layer, cleared


def extract_component(frame, seed):
    """Lift only the connected opaque illustration, never its nearby stars."""
    width, height = frame.size
    alpha = frame.getchannel("A")
    pixels = alpha.tobytes()
    start = seed[1] * width + seed[0]
    assert pixels[start] >= 90, f"Seed {seed} is outside the artwork"
    selected = bytearray(width * height)
    selected[start] = 255
    queue = deque([start])
    while queue:
        current = queue.popleft()
        x, y = current % width, current // width
        for neighbor in (current - 1 if x else -1,
                         current + 1 if x < width - 1 else -1,
                         current - width if y else -1,
                         current + width if y < height - 1 else -1):
            if neighbor >= 0 and not selected[neighbor] and pixels[neighbor] >= 90:
                selected[neighbor] = 255
                queue.append(neighbor)
    mask = Image.frombytes("L", frame.size, bytes(selected)).filter(ImageFilter.MaxFilter(5))
    layer = frame.copy()
    layer.putalpha(ImageChops.multiply(alpha, mask))
    cleared = frame.copy()
    cleared.paste((0, 0, 0, 0), (0, 0, width, height), mask)
    return layer, cleared


def transformed(layer, angle=0, scale=1):
    if scale != 1:
        size = (round(layer.width * scale), round(layer.height * scale))
        layer = layer.resize(size, Image.Resampling.BICUBIC)
    if angle:
        layer = layer.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    return layer


def compose_layer(background, layer, dx=0, dy=0, angle=0, scale=1):
    layer = transformed(layer, angle, scale)
    pos = ((background.width - layer.width) // 2 + round(dx),
           (background.height - layer.height) // 2 + round(dy))
    background.alpha_composite(layer, pos)
    return background


def draw_heart(draw, cx, cy, scale):
    s = scale
    points = [(cx, cy + 10*s), (cx - 14*s, cy - 2*s),
              (cx - 13*s, cy - 11*s), (cx - 7*s, cy - 14*s),
              (cx, cy - 7*s), (cx + 7*s, cy - 14*s),
              (cx + 13*s, cy - 11*s), (cx + 14*s, cy - 2*s)]
    draw.polygon(points, fill=(240, 83, 46, 230))


def make_frame(name, original, index):
    if index in (0, 23):
        return original.copy()
    p = index / 23
    frame = original.copy()
    draw = ImageDraw.Draw(frame, "RGBA")

    if name == "ball":
        sphere = local(name, (212, 190, 469, 449))
        layer, frame = extracted(frame, sphere)
        # Keep the orbital ring and surrounding stars in their original cells.
        hop = 28 * sin(pi * p)
        return compose_layer(frame, layer, dy=-hop, angle=-360*p)

    if name == "coffee":
        steam = local(name, (590, 112, 681, 224))
        layer, frame = extracted(frame, steam)
        # The cup is untouched; only the three existing ink strokes drift up.
        for i in range(3):
            alpha = .52 + .48 * sin(pi * (p + i * .22)) ** 2
            band = Image.new("L", layer.size)
            x0 = steam[0] + i * 28
            ImageDraw.Draw(band).rectangle((x0, steam[1], x0 + 29, steam[3]), fill=255)
            piece = layer.copy()
            piece.putalpha(ImageChops.multiply(layer.getchannel("A"), band).point(lambda a: round(a * alpha)))
            frame.alpha_composite(piece, (0, -round(15 * p + 3 * sin(pi * p + i))))
        return frame

    if name == "watch":
        cx, cy = 1147 - REGIONS[name][0], 652 - REGIONS[name][1]
        # Repaint only the inner dial, leaving the case, strap and nearby stars.
        draw.ellipse((cx-44, cy-44, cx+44, cy+44), fill=(255,255,255,255))
        for mark in range(12):
            theta = mark * pi / 6 - pi/2
            r0, r1 = (34, 40) if mark % 3 == 0 else (37, 40)
            draw.line((cx+r0*cos(theta), cy+r0*sin(theta),
                       cx+r1*cos(theta), cy+r1*sin(theta)), fill=(20,20,20,255), width=2)
        for angle, length, width in ((-115 + 360*p, 28, 5), (-18 + 360*p, 36, 4)):
            theta = angle * pi/180
            draw.line((cx,cy,cx+length*cos(theta),cy+length*sin(theta)),
                      fill=(12,12,12,255), width=width)
        draw.ellipse((cx-5,cy-5,cx+5,cy+5), fill=(12,12,12,255))
        return frame

    if name == "plant":
        # Include tiny disconnected ink flecks on the leaves, but not the stars.
        mask = Image.new("L", frame.size)
        ink = ImageDraw.Draw(mask)
        ink.rectangle((20, 0, 375, 319), fill=255)
        ink.ellipse((0, 178, 78, 272), fill=0)
        ink.ellipse((242, 230, 370, 320), fill=0)
        layer = frame.copy()
        layer.putalpha(ImageChops.multiply(frame.getchannel("A"), mask))
        frame.paste((0, 0, 0, 0), (0, 0, frame.width, frame.height), mask)
        growth = sin(pi*p)
        # Grow back from a brief, gentle inward curl; never clip the top leaf.
        return compose_layer(frame, layer, dy=5*growth, angle=2*sin(2*pi*p), scale=1-.07*growth)

    if name == "cat":
        layer, frame = extract_component(frame, (904-REGIONS[name][0], 680-REGIONS[name][1]))
        frame = compose_layer(frame, layer, dy=-5*sin(pi*p), angle=3*sin(2*pi*p))
        draw = ImageDraw.Draw(frame, "RGBA")
        heart = max(0, sin(pi*min(1, max(0, (p-.25)/.65))))
        if heart > .15:
            draw_heart(draw, 995-REGIONS[name][0], 572-REGIONS[name][1]-round(10*heart), .3+.35*heart)
        return frame

    if name == "gamepad":
        # Each of the four original dark buttons receives a short depressed state.
        for n, (x, y) in enumerate(((255,578),(278,580),(255,603),(278,605))):
            phase = (p - n*.21)/.16
            strength = max(0, 1-abs(phase-.5)*2)
            if strength:
                xx, yy = x-REGIONS[name][0], y-REGIONS[name][1]
                radius = 8 - 2*strength
                draw.ellipse((xx-radius,yy-radius,xx+radius,yy+radius),
                             fill=(45,45,45,round(205*strength)))
                draw.arc((xx-6,yy-6,xx+6,yy+6),180,345,
                         fill=(255,255,255,round(160*strength)),width=2)
        return frame

    if name == "tablet":
        # The original pen glides onto the screen, draws a short flourish, exits.
        pen, frame = extract_component(frame, (1255-REGIONS[name][0], 345-REGIONS[name][1]))
        travel = sin(pi*p)
        frame = compose_layer(frame, pen, dx=-62*travel, dy=-35*travel)
        draw = ImageDraw.Draw(frame, "RGBA")
        progress = max(0, min(1, (p-.18)/.58))
        path = [(996,353),(1005,348),(1015,354),(1025,346),(1037,352)]
        path = [(x-REGIONS[name][0],y-REGIONS[name][1]) for x,y in path]
        upto = max(1, round(progress*(len(path)-1)))
        if progress:
            draw.line(path[:upto+1], fill=(20,20,20,round(255*progress)),width=3,joint="curve")
        return frame

    if name == "paper":
        progress = sin(pi*p)
        x0, y0 = 172-REGIONS[name][0], 987-REGIONS[name][1]
        draw.line((x0,y0,x0+round(50*progress),y0+round(15*progress)),
                  fill=(25,25,25,round(240*progress)),width=3)
        return frame
    raise ValueError(name)


base = SOURCE.copy()
for rectangle in REGIONS.values():
    base.paste((0,0,0,0), rectangle)
base.save(OUT / "composition-base.webp", lossless=True, method=6)

rebuilt = base.copy()
for name, rectangle in REGIONS.items():
    original = SOURCE.crop(rectangle)
    width, height = original.size
    atlas = Image.new("RGBA", (width*6, height*4))
    for index in range(24):
        frame = make_frame(name, original, index)
        if index == 23:
            assert ImageChops.difference(frame, original).getbbox() is None, f"{name} does not end on its original pixels"
        atlas.alpha_composite(frame, ((index%6)*width, (index//6)*height))
    atlas.save(OUT / f"{name}-24.webp", lossless=True, method=6)
    rebuilt.alpha_composite(original, rectangle[:2])
    print(f"{name}: {width}x{height} × 24, {atlas.width}x{atlas.height}")

assert ImageChops.difference(rebuilt, SOURCE).getbbox() is None, "Frame 0 shifted from the original"
print("Frame 0 reconstruction matches the original composition pixel for pixel")
