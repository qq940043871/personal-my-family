"""生成修复前后对比图：旧素材 vs 新素材，按小程序实际 36px 圆形显示并放大。"""
import os
from PIL import Image, ImageDraw

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'family-check-in-mini')
NEW = os.path.join(BASE, 'images', 'avatars')
OLD = os.path.join(BASE, 'tools', 'backup')
OUT = os.path.join(BASE, 'tools', '_fix_compare.png')

FILES = [
    ('avatar-dad.jpg', '爸爸'),
    ('avatar-mom.jpg', '妈妈'),
    ('avatar-son.jpg', '小龙'),
    ('avatar-baby.jpg', '小宝'),
    ('avatar-grandma.jpg', '奶奶'),
]

SM = 36      # 卡片里的实际显示尺寸
Z = 9        # 放大倍数
GAP = 14
LABEL_H = 26

cellw = SM * Z
W = (cellw + GAP) * len(FILES) + GAP
H = (SM * Z + LABEL_H) * 2 + GAP * 3
cv = Image.new('RGB', (W, H), '#F7F7F7')
draw = ImageDraw.Draw(cv)


def render(path, x, y):
    im = Image.open(path).convert('RGB').resize((SM, SM), Image.LANCZOS)
    mask = Image.new('L', (SM, SM), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, SM - 1, SM - 1), fill=255)
    cell = Image.new('RGB', (SM, SM), '#FFFFFF')
    cell.paste(im, (0, 0), mask)
    cv.paste(cell.resize((SM * Z, SM * Z), Image.NEAREST), (x, y))


rows = [('修复前（旧素材）', OLD), ('修复后（新素材）', NEW)]
for r, (title, folder) in enumerate(rows):
    y = GAP + r * (SM * Z + LABEL_H + GAP)
    draw.text((GAP, y - 16), title, fill='#222222')
    for i, (f, name) in enumerate(FILES):
        x = GAP + i * (cellw + GAP)
        render(os.path.join(folder, f), x, y)
        draw.text((x + 4, y + SM * Z + 4), name, fill='#555555')

cv.save(OUT)
print('SAVED', OUT, cv.size)
