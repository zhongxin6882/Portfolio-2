"""Build seamless 48-frame looping About sprites from the original artwork.

The reference images guide placement; sprite pixels come only from the existing
portrait-elements-hd.webp. Both ends of each loop match its original artwork.
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
FRAME_COUNT = 48
COLUMNS = 8
ROWS = FRAME_COUNT // COLUMNS

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
    elif mask_shape == "rectangle":
        draw.rectangle(box, fill=255)
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
    if index in (0, FRAME_COUNT - 1):
        return original.copy()
    p = index / (FRAME_COUNT - 1)
    phase = 2 * pi * p
    swell = (1 - cos(phase)) / 2
    frame = original.copy()
    draw = ImageDraw.Draw(frame, "RGBA")

    if name == "ball":
        sphere = local(name, (212, 190, 469, 449))
        layer, frame = extracted(frame, sphere)
        # Keep the orbital ring and surrounding stars in their original cells.
        # One full spin with a readable bounce that stays clear of the portrait.
        return compose_layer(frame, layer, dy=22*swell, angle=-360*p)

    if name == "coffee":
        steam = local(name, (580, 108, 690, 218))
        layer, frame = extracted(frame, steam, "rectangle")
        # Existing ink steam stretches, curls and settles back into the cup.
        steam_ink = layer.crop(steam)
        height = max(1, round(steam_ink.height * (1 - .32*swell)))
        steam_ink = steam_ink.resize((steam_ink.width, height), Image.Resampling.BICUBIC)
        frame.alpha_composite(steam_ink, (steam[0] + round(9*sin(phase)), steam[3] - height))
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
        # Pot stays planted while the leaves curl in and grow fully open again.
        shrink = .20*swell
        return compose_layer(frame, layer, dy=frame.height*shrink/2,
                             angle=3*sin(phase), scale=1-shrink)

    if name == "cat":
        layer, frame = extract_component(frame, (904-REGIONS[name][0], 680-REGIONS[name][1]))
        frame = compose_layer(frame, layer, dx=9*sin(phase), dy=5*swell,
                              angle=3*sin(phase))
        draw = ImageDraw.Draw(frame, "RGBA")
        heart = max(0, sin(pi*min(1, max(0, (p-.14)/.72))))
        if heart > .15:
            draw_heart(draw, 995-REGIONS[name][0], 572-REGIONS[name][1]-round(18*heart), .4+.65*heart)
        return frame

    if name == "gamepad":
        controller, frame = extract_component(frame, (200-REGIONS[name][0], 700-REGIONS[name][1]))
        draw = ImageDraw.Draw(controller, "RGBA")
        # Each of the four original dark buttons receives a short depressed state.
        for n, (x, y) in enumerate(((255,578),(278,580),(255,603),(278,605))):
            key_phase = p*4 - n
            strength = sin(pi*(key_phase-.1)/.8) if .1 < key_phase < .9 else 0
            if strength:
                xx, yy = x-REGIONS[name][0], y-REGIONS[name][1]
                radius = 8 + 5*strength
                draw.ellipse((xx-radius,yy-radius,xx+radius,yy+radius),
                             fill=(35,35,35,round(235*strength)))
                draw.arc((xx-radius,yy-radius,xx+radius,yy+radius),185,345,
                         fill=(255,255,255,round(210*strength)),width=3)
        return compose_layer(frame, controller, dy=5*swell, angle=4*sin(phase))

    if name == "tablet":
        # The original pen glides onto the screen, draws a short flourish, exits.
        pen, frame = extract_component(frame, (1255-REGIONS[name][0], 345-REGIONS[name][1]))
        travel = swell
        frame = compose_layer(frame, pen, dx=-88*travel, dy=-54*travel)
        draw = ImageDraw.Draw(frame, "RGBA")
        progress = max(0, min(1, (p-.10)/.53))
        fade = max(0, min(1, (.97-p)/.20))
        path = [(1088,447),(1081,440),(1074,441),(1067,432),(1059,433),(1052,426)]
        path = [(x-REGIONS[name][0],y-REGIONS[name][1]) for x,y in path]
        upto = max(1, round(progress*(len(path)-1)))
        if progress:
            draw.line(path[:upto+1], fill=(20,20,20,round(255*fade)),width=4,joint="curve")
        return frame

    if name == "paper":
        progress = sin(pi*p)**2
        x0, y0 = 147-REGIONS[name][0], 983-REGIONS[name][1]
        draw.line((x0,y0,x0+round(58*progress),y0+round(17*progress)),
                  fill=(25,25,25,round(255*progress)),width=4)
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
    atlas = Image.new("RGBA", (width*COLUMNS, height*ROWS))
    for index in range(FRAME_COUNT):
        frame = make_frame(name, original, index)
        if index == FRAME_COUNT - 1:
            assert ImageChops.difference(frame, original).getbbox() is None, f"{name} does not end on its original pixels"
        atlas.alpha_composite(frame, ((index%COLUMNS)*width, (index//COLUMNS)*height))
    atlas.save(OUT / f"{name}-loop.webp", lossless=True, method=6)
    rebuilt.alpha_composite(original, rectangle[:2])
    print(f"{name}: {width}x{height} × {FRAME_COUNT}, {atlas.width}x{atlas.height}")

assert ImageChops.difference(rebuilt, SOURCE).getbbox() is None, "Frame 0 shifted from the original"
print("Frame 0 reconstruction matches the original composition pixel for pixel")
