"""Build seamless 48-frame looping About sprites from the original artwork.

The reference images guide placement; sprite pixels come only from the existing
portrait-elements-hd.webp. Both ends of each loop match its original artwork.
"""

from math import cos, pi, sin, radians
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
    "coffee": (550, 70, 745, 370),
    "tablet": (745, 170, 1324, 545),
    "gamepad": (80, 540, 430, 850),
    "cat": (790, 545, 1040, 760),
    "watch": (1040, 545, 1324, 770),
    "plant": (870, 770, 1260, 1100),
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
    assert pixels[start] >= 1, f"Seed {seed} is outside the artwork"
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
            if neighbor >= 0 and not selected[neighbor] and pixels[neighbor] >= 1:
                selected[neighbor] = 255
                queue.append(neighbor)
    mask = Image.frombytes("L", frame.size, bytes(selected)).filter(ImageFilter.MaxFilter(9))
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


def compose_crop_at(background, layer, box, dx=0, dy=0, angle=0):
    """Rotate a cutout around its own center, not its much larger sprite cell."""
    piece = transformed(layer.crop(box), angle=angle)
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    background.alpha_composite(piece, (round(cx + dx - piece.width/2),
                                       round(cy + dy - piece.height/2)))
    return background


def pen_at_tip(background, pen, box, original_tip, target_tip, angle):
    """Keep the actual pen nib on the drawn stroke through its rotation."""
    piece = pen.crop(box)
    rotated = transformed(piece, angle=angle)
    theta = radians(angle)
    tip_x = original_tip[0] - box[0] - piece.width/2
    tip_y = original_tip[1] - box[1] - piece.height/2
    turned_x = tip_x*cos(theta) + tip_y*sin(theta) + rotated.width/2
    turned_y = -tip_x*sin(theta) + tip_y*cos(theta) + rotated.height/2
    background.alpha_composite(rotated, (round(target_tip[0] - turned_x),
                                         round(target_tip[1] - turned_y)))
    return background


def stroke_until(points, progress):
    position = max(0, min(len(points)-1, progress * (len(points)-1)))
    whole = int(position)
    result = list(points[:whole+1])
    if whole < len(points)-1:
        fraction = position - whole
        a, b = points[whole], points[whole+1]
        result.append((a[0] + (b[0]-a[0])*fraction,
                       a[1] + (b[1]-a[1])*fraction))
    return result


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
        # The hoop/ring and stars stay fixed; spin the ball about its own center.
        return compose_crop_at(frame, layer, sphere, dy=-9*swell, angle=-360*p)

    if name == "coffee":
        steam = local(name, (575, 75, 695, 217))
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
        # Shift upper leaf rows like a light gust; stems taper to zero motion at
        # the pot, which remains exactly where it was in the original artwork.
        leaf_left, leaf_right, hinge = 20, 375, 184
        leaves = frame.crop((leaf_left, 0, leaf_right, hinge))
        frame.paste((0, 0, 0, 0), (leaf_left, 0, leaf_right, hinge))
        wind = 7 * (sin(phase) + .18*sin(2*phase))
        for y in range(hinge):
            weight = ((hinge-y)/hinge) ** 1.7
            offset = round(wind * weight)
            frame.alpha_composite(leaves.crop((0,y,leaf_right-leaf_left,y+1)),
                                  (leaf_left+offset,y))
        return frame

    if name == "cat":
        layer, frame = extract_component(frame, (904-REGIONS[name][0], 680-REGIONS[name][1]))
        # Compress the two existing eye drawings into blinks; no extra pupils.
        blink = max(0, 1-abs(p-.30)/.055, 1-abs(p-.68)/.055)
        if blink:
            for box in (local(name,(855,621,898,663)),
                        local(name,(917,630,958,672))):
                eye = layer.crop(box)
                ImageDraw.Draw(layer).rectangle(box, fill=(255,255,255,255))
                height = max(3, round(eye.height * (1-.91*blink)))
                eye = eye.resize((eye.width,height), Image.Resampling.BICUBIC)
                layer.alpha_composite(eye,(box[0],round((box[1]+box[3]-height)/2)))
        frame = compose_layer(frame, layer, dx=3*sin(phase), dy=2*swell,
                              angle=2*sin(phase))
        heart = max(0, sin(pi*min(1, max(0, (p-.13)/.72))))
        if heart > .15:
            draw_heart(ImageDraw.Draw(frame,"RGBA"),
                       1018-REGIONS[name][0], 582-REGIONS[name][1]-round(4*heart),
                       .27+.25*heart)
        return frame

    if name == "gamepad":
        # Darken pixels *inside* the six actual button centers. No new circles
        # or controller tilt, so no duplicated/misaligned button outlines.
        buttons = ((256,575,6),(279,577,6),(257,599,6),(279,600,6),
                   (261,632,7),(206,680,7))
        pixels = frame.load()
        for n,(x,y,radius) in enumerate(buttons):
            key_phase = p*len(buttons)-n
            strength = sin(pi*(key_phase-.08)/.84) if .08 < key_phase < .92 else 0
            if strength <= 0:
                continue
            cx,cy = x-REGIONS[name][0],y-REGIONS[name][1]
            for yy in range(cy-radius,cy+radius+1):
                for xx in range(cx-radius,cx+radius+1):
                    distance = ((xx-cx)**2+(yy-cy)**2)**.5
                    if distance > radius:
                        continue
                    red,green,blue,alpha = pixels[xx,yy]
                    if alpha and 45 < (red+green+blue)/3 < 230:
                        factor = 1-.83*strength*(1-.32*distance/radius)
                        pixels[xx,yy] = (round(red*factor),round(green*factor),
                                         round(blue*factor),alpha)
        return frame

    if name == "tablet":
        # Put the original nib on the screen, then follow a visible five-point
        # sketch in the right-hand sky before returning to its starting pose.
        pen, frame = extract_component(frame, (1255-REGIONS[name][0], 345-REGIONS[name][1]))
        box = pen.getbbox()
        original_tip = (1157-REGIONS[name][0],486-REGIONS[name][1])
        path = [(1025,342),(1035,321),(1045,341),(1021,328),(1049,328),(1025,342)]
        path = [(x-REGIONS[name][0],y-REGIONS[name][1]) for x,y in path]
        if p < .24:
            travel = (p/.24)**2 * (3-2*p/.24)
            tip = tuple(original_tip[i]+(path[0][i]-original_tip[i])*travel for i in (0,1))
            angle = -30*travel
            progress = 0
        elif p < .72:
            progress = (p-.24)/.48
            tip = stroke_until(path,progress)[-1]
            angle = -30
        else:
            travel = ((p-.72)/.28)**2 * (3-2*(p-.72)/.28)
            tip = tuple(path[-1][i]+(original_tip[i]-path[-1][i])*travel for i in (0,1))
            angle = -30*(1-travel)
            progress = 1
        if progress:
            fade = min(1,max(0,(1-p)/.18))
            ImageDraw.Draw(frame,"RGBA").line(stroke_until(path,progress),
                                                fill=(20,20,20,round(255*fade)),
                                                width=4,joint="curve")
        frame = pen_at_tip(frame,pen,box,original_tip,tip,angle)
        return frame

    if name == "paper":
        # Reveal/hide the actual top line printed on the paper, not a new mark.
        ink = Image.new("L",frame.size)
        ImageDraw.Draw(ink).polygon([(181-REGIONS[name][0],912-REGIONS[name][1]),
                                     (243-REGIONS[name][0],929-REGIONS[name][1]),
                                     (241-REGIONS[name][0],941-REGIONS[name][1]),
                                     (179-REGIONS[name][0],924-REGIONS[name][1])],fill=255)
        paper = original.load()
        pixels = frame.load()
        for y in range(61,92):
            for x in range(108,175):
                if ink.getpixel((x,y)):
                    pixels[x,y] = paper[x,y-16]
        visible = Image.new("L",frame.size)
        cutoff = round((182-REGIONS[name][0]) + 60*(1-.78*swell))
        ImageDraw.Draw(visible).rectangle((0,0,cutoff,frame.height),fill=255)
        frame.paste(original,(0,0),ImageChops.multiply(ink,visible))
        return frame
    raise ValueError(name)


def isolate_subject(name, original):
    """Keep the animated illustration, leaving every sparkle and orbit intact."""
    if name == "ball":
        mask = Image.new("L", original.size)
        ImageDraw.Draw(mask).ellipse(local(name, (212,190,469,449)), fill=255)
        subject = original.copy()
        subject.putalpha(ImageChops.multiply(original.getchannel("A"), mask))
        remainder = original.copy()
        remainder.paste((0,0,0,0), (0,0,*original.size), mask)
        return subject, remainder

    seeds = {
        "coffee": (625,285), "tablet": (950,370),
        "gamepad": (200,700), "cat": (904,680),
        "watch": (1147,652), "plant": (1030,1000),
        "paper": (180,950),
    }
    x0,y0,_,_ = REGIONS[name]
    seed = seeds[name]
    subject, remainder = extract_component(original, (seed[0]-x0,seed[1]-y0))
    if name == "tablet":
        pen, remainder = extract_component(remainder, (1255-x0,345-y0))
        subject.alpha_composite(pen)
    if name == "coffee":
        steam_mask = Image.new("L", original.size)
        steam_box = local(name,(575,75,695,217))
        ImageDraw.Draw(steam_mask).rectangle(steam_box, fill=255)
        subject.paste(original.crop(steam_box),steam_box[:2])
        remainder.paste((0,0,0,0),(0,0,*original.size),steam_mask)
    return subject, remainder


# The decorative stars and sweeping ink lines are separate, uncut assets.
# They never travel inside another element's animation cell.
decor = SOURCE.copy()
subjects = {}
for name, rectangle in REGIONS.items():
    subject, remainder = isolate_subject(name, SOURCE.crop(rectangle))
    subjects[name] = subject
    decor.paste(remainder, rectangle[:2])

STAR_BOXES = [
    (80,245,145,320), (470,187,523,250), (745,97,827,194),
    (1165,173,1238,256), (477,376,558,470), (376,468,442,548),
    (777,475,851,553), (1019,555,1064,613), (1236,630,1302,709),
    (1019,694,1068,759), (280,729,328,787), (73,768,148,857),
    (268,968,326,1035), (878,949,939,1021), (1117,985,1197,1082),
]
stars = Image.new("RGBA", SOURCE.size)
lines = decor.copy()
for box in STAR_BOXES:
    stars.alpha_composite(decor.crop(box),box[:2])
    ImageDraw.Draw(lines).rectangle(box,fill=(0,0,0,0))
stars.save(OUT / "decor-stars.webp", lossless=True, method=6)
lines.save(OUT / "decor-lines.webp", lossless=True, method=6)

rebuilt = decor.copy()
for name, rectangle in REGIONS.items():
    original = subjects[name]
    width, height = original.size
    atlas = Image.new("RGBA", (width*COLUMNS, height*ROWS))
    for index in range(FRAME_COUNT):
        frame = make_frame(name, original, index)
        if index == FRAME_COUNT - 1:
            assert frame.tobytes() == original.tobytes(), f"{name} does not end on its original pixels"
        atlas.alpha_composite(frame, ((index%COLUMNS)*width, (index//COLUMNS)*height))
    atlas.save(OUT / f"{name}-loop.webp", lossless=True, method=6)
    rebuilt.alpha_composite(original, rectangle[:2])
    print(f"{name}: {width}x{height} × {FRAME_COUNT}, {atlas.width}x{atlas.height}")

def visible(image):
    canvas = Image.new("RGB", image.size, (252,250,248))
    canvas.paste(image, mask=image.getchannel("A"))
    return canvas

diff = ImageChops.difference(visible(rebuilt), visible(SOURCE))
print(f"Reconstruction difference bounds: {diff.getbbox()}")
assert diff.getbbox() is None, "Subjects and decorations did not reconstruct the original"
print("Decoration and subject layers reconstruct the original visible composition")
