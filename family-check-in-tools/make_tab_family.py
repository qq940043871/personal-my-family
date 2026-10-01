"""生成「家庭」tab 图标：一大一小两个人形 + 心形，填充风格与现有图标一致。

输出 images/tab/family.png（灰 #8A8178）与 family-active.png（橙 #FF8A65），78×78 RGBA。
"""
import os
from PIL import Image, ImageDraw

DST = os.path.join(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'family-check-in-mini'), 'images', 'tab')
SS = 8                      # 超采样倍数
CANVAS = 78

def draw_family(color):
    S = CANVAS * SS
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # ---- 大人（左） ----
    # 头
    hx, hy, hr = 24 * SS, 20 * SS, 10 * SS
    d.ellipse((hx - hr, hy - hr, hx + hr, hy + hr), fill=color)
    # 肩膀（上半圆盘）
    d.pieslice((7 * SS, 33 * SS, 41 * SS, 67 * SS), 180, 360, fill=color)
    # 肩膀底部裁平
    d.rectangle((7 * SS, 58 * SS, 41 * SS, 67 * SS), fill=(0, 0, 0, 0))

    # ---- 小孩（右） ----
    cx, cy, cr = 55 * SS, 30 * SS, 7.5 * SS
    d.ellipse((cx - cr, cy - cr, cx + cr, cy + cr), fill=color)
    d.pieslice((43 * SS, 40 * SS, 67 * SS, 64 * SS), 180, 360, fill=color)
    d.rectangle((43 * SS, 52 * SS, 67 * SS, 64 * SS), fill=(0, 0, 0, 0))

    return im.resize((CANVAS, CANVAS), Image.LANCZOS)

os.makedirs(DST, exist_ok=True)
for name, color in [
    ('family.png', (138, 129, 120, 255)),          # #8A8178
    ('family-active.png', (255, 138, 101, 255)),   # #FF8A65
]:
    p = os.path.join(DST, name)
    draw_family(color).save(p)
    print(name, os.path.getsize(p), 'bytes')

# 预览图（白底放大，便于人工检查）
prev = Image.new('RGBA', (78 * 2 + 12, 78), (255, 255, 255, 255))
prev.alpha_composite(Image.open(os.path.join(DST, 'family.png')), (0, 0))
prev.alpha_composite(Image.open(os.path.join(DST, 'family-active.png')), (78 + 12, 0))
prev.resize(((78 * 2 + 12) * 3, 78 * 3), Image.NEAREST).save(os.path.join(DST, '_preview_family.png'))
print('preview saved')
