"""测量每张头像中人头的包围盒，判断圆形裁切时是否会被切边。"""
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
    bg = px[2, 2]          # 左上角当作背景色
    def isbg(c):
        return sum(abs(a - b) for a, b in zip(c, bg)) < 30

    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if not isbg(px[x, y]):
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    # 圆形裁切半径 r=w/2，圆心 (w/2,h/2) —— 判断头部四角是否伸出圆外
    print(f'--- {f} --- 背景={bg}')
    print(f'  头部包围盒 x:{minx}-{maxx}  y:{miny}-{maxy}   (图 {w}x{h})')
    print(f'  距边: 左{minx}  右{w-1-maxx}  上{miny}  下{h-1-maxy}')
    # 头顶是否被圆切：圆在 x=w/2 处的最高点是 y=0，但侧边高度受限
    # 检查包围盒水平方向的极值点是否落在圆外
    for label, (x, y) in {
        '左上角点': (minx, miny), '右上角点': (maxx, miny),
        '左极点': (minx, (miny + maxy) // 2), '右极点': (maxx, (miny + maxy) // 2),
        '顶点': ((minx + maxx) // 2, miny),
    }.items():
        dx = x - w / 2
        dy = y - h / 2
        inside = (dx * dx + dy * dy) <= (w / 2) ** 2
        print(f'    {label} ({x},{y}) -> {"圆内" if inside else "圆外(会被裁掉)"}')
