"""用「深色头发」作为特征，测量各头像中头部的位置与大小（相对内圆归一化）。

用于判断爸爸那张的构图是否偏离其他四张，并给出需要缩放的倍率。
"""
import os
from PIL import Image

BASE = os.path.dirname(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'family-check-in-mini'))
SRC = os.path.join(BASE, 'family-check-in', 'static', 'avatars')

DISC = {
    'avatar-dad.png':     (506, 506, 506, 506),
    'avatar-mom.png':     (507, 506, 506, 506),
    'avatar-son.png':     (506, 506, 433, 436),
    'avatar-baby.png':    (509, 507, 479, 479),
    'avatar-grandma.png': (524, 526, 488, 476),
}

LUM_HAIR = 95          # 头发亮度上限

print(f'{"头像":<12}{"发顶位置":<12}{"头部宽占比":<12}{"头部水平中心偏移":<14}{"头部垂直中心偏移"}')
print('-' * 78)
rows = {}
for f, (cx, cy, rx, ry) in DISC.items():
    im = Image.open(os.path.join(SRC, f)).convert('L')
    w, h = im.size
    px = im.load()
    r = min(rx, ry)
    x0, y0 = int(cx - r), int(cy - r)

    dark = []
    for y in range(y0, y0 + 2 * r):
        for x in range(x0, x0 + 2 * r):
            dx, dy = x - cx, y - cy
            if dx * dx + dy * dy > r * r:
                continue
            if px[x, y] < LUM_HAIR:
                dark.append((x, y))
    if not dark:
        print(f'{f:<12} 未检出深色头发')
        continue

    ys = [p[1] for p in dark]
    top = min(ys)
    band = [p for p in dark if p[1] <= top + 0.45 * r]     # 发顶附近带
    xs = [p[0] for p in band]
    bw = max(xs) - min(xs)
    bcx = (max(xs) + min(xs)) / 2
    bcy = (top + (top + 0.45 * r)) / 2

    top_ratio = (top - y0) / (2 * r)          # 发顶距圆顶比例：越大越"有留白"
    w_ratio = bw / (2 * r)                    # 头部宽度占圆直径
    off_x = (bcx - cx) / r                    # 水平偏移（占半径）
    off_y = (bcy - cy) / r

    rows[f] = (top_ratio, w_ratio)
    print(f'{f:<12}{top_ratio:<12.3f}{w_ratio:<12.3f}{off_x:<14.3f}{off_y:.3f}')

# 以 mom/son/baby 为基准，算爸爸需要放大的倍率
base = [rows[k][1] for k in rows if k in
        ('avatar-mom.png', 'avatar-son.png', 'avatar-baby.png')]
avg_w = sum(base) / len(base)
avg_top = sum(rows[k][0] for k in ('avatar-mom.png', 'avatar-son.png', 'avatar-baby.png')) / 3
print()
print(f'基准头部宽占比(妈妈/小龙/小宝均值) = {avg_w:.3f}')
print(f'基准发顶比例(同上)                = {avg_top:.3f}')
if 'avatar-dad.png' in rows:
    dw, dt = rows['avatar-dad.png']
    print(f'爸爸头部宽占比 = {dw:.3f}  →  需要缩放倍率 ≈ {avg_w / dw:.3f}')
    print(f'爸爸发顶比例   = {dt:.3f}  →  目标 {avg_top:.3f}，需要下移 {(avg_top - dt) * 100:.1f}% 圆直径')
