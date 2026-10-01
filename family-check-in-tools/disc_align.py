"""把 5 张原图按内圆对齐裁切到同一比例，圆形裁切后拼图对比人物占比。"""
import os
from PIL import Image, ImageDraw

BASE = os.path.dirname(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'family-check-in-mini'))
SRC = os.path.join(BASE, 'family-check-in', 'static', 'avatars')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_disc_align.png')

# 用 measure_disc.py 测出的内圆几何
DISC = {
    'avatar-dad.png':     (506, 506, 506, 506),
    'avatar-mom.png':     (507, 506, 506, 506),
    'avatar-son.png':     (506, 506, 433, 436),
    'avatar-baby.png':    (509, 507, 479, 479),
    'avatar-grandma.png': (524, 526, 488, 476),
}

CELL = 300
cv = Image.new('RGB', (CELL * 5 + 60, CELL + 60), '#FFFFFF')
draw = ImageDraw.Draw(cv)

for i, (f, (cx, cy, rx, ry)) in enumerate(DISC.items()):
    im = Image.open(os.path.join(SRC, f)).convert('RGB')
    r = min(rx, ry)                       # 取内切圆，避免带进方底
    box = (int(cx - r), int(cy - r), int(cx + r), int(cy + r))
    disc = im.crop(box).resize((CELL, CELL), Image.LANCZOS)

    # 圆形遮罩：模拟小程序 border-radius:50%
    mask = Image.new('L', (CELL, CELL), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, CELL - 1, CELL - 1), fill=255)

    x = 10 + i * (CELL + 10)
    cv.paste(disc, (x, 10), mask)
    draw.text((x + 4, CELL + 18), f.replace('avatar-', '').replace('.png', ''), fill='#111')

cv.save(OUT)
print('SAVED', OUT, cv.size)
