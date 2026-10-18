"""App icons and the social sharing image, in the four-pillars style (run once; outputs are committed)."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "icons")
os.makedirs(OUT, exist_ok=True)
NAVY, PAPER = (26, 47, 90), (242, 239, 234)
YEL, BLUE, CORAL, TEAL = (245, 194, 27), (37, 99, 217), (232, 87, 77), (31, 143, 168)


def mark(d, cx, cy, s, ring=(255, 255, 255)):
    r = s * 0.2
    for (dx, dy), col in (((0, -1), YEL), ((-1, 0), BLUE), ((1, 0), CORAL), ((0, 1), TEAL)):
        x, y = cx + dx * s * 0.2, cy + dy * s * 0.2
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)
    c = s * 0.14
    d.ellipse([cx - c, cy - c, cx + c, cy + c], fill=NAVY, outline=ring, width=max(2, int(s * 0.03)))


def icon(size, safe=1.0, rounded=True):
    big = size * 4
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.22) if rounded else 0, fill=NAVY)
    mark(d, big / 2, big / 2, big * 0.95 * safe)
    return img.resize((size, size), Image.LANCZOS)


icon(192).save(os.path.join(OUT, "icon-192.png"))
icon(512).save(os.path.join(OUT, "icon-512.png"))
icon(512, safe=0.68, rounded=False).save(os.path.join(OUT, "icon-maskable-512.png"))
icon(180, rounded=False).convert("RGB").save(os.path.join(OUT, "apple-touch-icon.png"))
icon(32).save(os.path.join(OUT, "favicon-32.png"))

# 1200x630 sharing image: paper left with the mark and title, photo right
W, H = 1200, 630
og = Image.new("RGB", (W, H), PAPER)
photo = os.path.join(ROOT, "docs", "img", "m", "excavator.jpg")
if not os.path.exists(photo):
    photo = os.path.join(ROOT, "docs", "img", "own", "loader-1.jpg")
p = ImageOps.fit(Image.open(photo).convert("RGB"), (470, H))
og.paste(p, (W - 470, 0))
d = ImageDraw.Draw(og)
d.rectangle([0, 0, W, 14], fill=NAVY)
mark(d, 140, 170, 230, ring=PAPER)
serif = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
sans = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
sansb = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
d.text((60, 300), "Yellowmetal", font=ImageFont.truetype(serif, 84), fill=(22, 33, 58))
d.text((64, 415), "Hire · Buy · List · Source", font=ImageFont.truetype(sansb, 34), fill=(22, 33, 58))
d.text((64, 470), "Heavy equipment across Nigeria at", font=ImageFont.truetype(sans, 27), fill=(94, 101, 115))
d.text((64, 506), "rate-book prices, closed on WhatsApp.", font=ImageFont.truetype(sans, 27), fill=(94, 101, 115))
d.text((64, 568), "yellowmetal.store", font=ImageFont.truetype(sansb, 26), fill=BLUE)
og.save(os.path.join(ROOT, "docs", "img", "og.jpg"), quality=86)
print("icons and og image written")
