"""把 5 张头像按小程序圆形裁切 + 小尺寸预览，拼成对比图，肉眼排查异常。"""
import os
from PIL import Image, ImageDraw

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'family-check-in-mini')
AV = os.path.join(BASE, 'images', 'avatars')
OUT = os.path.join(BASE, 'tools', '_avatar_check.png')

FILES = [
    ('avatar-dad.jpg', 'dad'),
    ('avatar-mom.jpg', 'mom'),
    ('avatar-son.jpg', 'dabao'),
    ('avatar-baby.jpg', 'erbao'),
    ('avatar-grandma.jpg', 'grandma'),
]

CELL = 200
PAD = 20
SMALL = 72          # 模拟首页成员卡 72rpx 等比缩小
canvas = Image.new('RGB', (CELL * len(FILES) + PAD * 2, CELL + SMALL + PAD * 4 + 60), '#F3F4F6')
draw = ImageDraw.Draw(canvas)

for i, (fname, key) in enumerate(FILES):
    p = os.path.join(AV, fname)
    im = Image.open(p).convert('RGB')
    print(fname, im.size, im.mode)

    x = PAD + i * CELL
    y = PAD
    canvas.paste(im.resize((CELL, CELL), Image.LANCZOS), (x, y))

    # 圆形遮罩版（模拟小程序 border-radius:50%）
    big = im.resize((CELL, CELL), Image.LANCZOS)
    mask = Image.new('L', (CELL, CELL), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, CELL - 1, CELL - 1), fill=255)
    y2 = y + CELL + PAD
    canvas.paste(big, (x, y2), mask)

    # 小尺寸版（模拟实际卡片里的显示大小）
    small = im.resize((SMALL, SMALL), Image.LANCZOS)
    m2 = Image.new('L', (SMALL, SMALL), 0)
    ImageDraw.Draw(m2).ellipse((0, 0, SMALL - 1, SMALL - 1), fill=255)
    y3 = y2 + CELL + PAD
    canvas.paste(small, (x + (CELL - SMALL) // 2, y3), m2)
    draw.text((x + 4, y3 + SMALL + 4), key, fill='#111111')

canvas.save(OUT)
print('SAVED', OUT, canvas.size)
