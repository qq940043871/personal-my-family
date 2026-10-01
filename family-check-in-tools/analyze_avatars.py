"""量化分析 5 张头像：四角颜色、中心横线色带、内圆半径，定位爸爸那张的差异。"""
import os
from PIL import Image

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'family-check-in-mini')
AV = os.path.join(BASE, 'images', 'avatars')

FILES = ['avatar-dad.jpg', 'avatar-mom.jpg', 'avatar-son.jpg',
         'avatar-baby.jpg', 'avatar-grandma.jpg']

for f in FILES:
    im = Image.open(os.path.join(AV, f)).convert('RGB')
    w, h = im.size
    px = im.load()
    corners = {
        'TL': px[2, 2], 'TR': px[w - 3, 2],
        'BL': px[2, h - 3], 'BR': px[w - 3, h - 3],
    }
    # 顶部中间（应为内圆背景色）
    top_mid = px[w // 2, 2]
    # 沿垂直中心线自顶向下采样，找颜色突变
    bands = []
    prev = px[w // 2, 0]
    for y in range(1, h // 2):
        c = px[w // 2, y]
        if sum(abs(a - b) for a, b in zip(c, prev)) > 24:
            bands.append((y, prev, c))
        prev = c
    print(f'--- {f} ---')
    print('  corners TL/TR/BL/BR:', corners)
    print('  top-mid(顶部内圆色):', top_mid)
    print('  自上向下颜色突变点:', bands[:4])
