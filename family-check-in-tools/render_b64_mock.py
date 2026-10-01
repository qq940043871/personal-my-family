# -*- coding: utf-8 -*-
"""
用 utils/avatars.js 里真实的 base64 数据渲染一张成员卡预览图，
证明内联头像端到端可用（数据 -> 渲染），供人工核对。
"""
import io
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

MEMBERS = [
    ('dad', '爸爸', '38岁 · 家长', '#2563EB', '铁柱', '🐶', '忠诚犬', 42, 2340, 12, 67),
    ('mom', '妈妈', '36岁 · 家长', '#EC4899', '露娜', '🐱', '优雅猫', 68, 3250, 23, 100),
    ('dabao', '小龙', '9岁 · 学龄', '#F59E0B', '小龙', '🐉', '战斗龙', 25, 1560, 8, 55),
    ('erbao', '小宝', '3岁 · 幼儿', '#FBBF24', '豆豆', '🐣', '叽叽鸡', 80, 380, 5, 90),
    ('grandma', '奶奶', '67岁 · 长辈', '#A88B6A', '福宝', '🐢', '长寿龟', 55, 4180, 31, 78),
]


def load_avatars():
    src = io.open(os.path.join(ROOT, 'utils', 'avatars.js'), encoding='utf-8').read()
    blocks = dict(re.findall(r'const (\w+) = \[(.*?)\]\.join', src, re.S))
    out = {}
    for key, body in blocks.items():
        parts = re.findall(r"'([^']*)'", body)
        out[key] = ''.join(parts)
    return out


def card(mid, name, role, color, pet, pet_icon, species, grow, points, streak, rate, uri):
    return u'''
  <div class="card" style="--c:{color}">
    <div class="head">
      <div class="avatar"><img src="{uri}" alt=""/></div>
      <div class="who"><div class="name">{name}</div><div class="role">{role}</div></div>
      <div class="paw">🐾</div>
    </div>
    <div class="pet"><span class="pi">{pet_icon}</span><b>{pet}</b><i>{species}</i></div>
    <div class="bar"><span style="width:{grow}%"></span></div>
    <div class="stats">
      <div><em style="color:{color}">{grow}%</em><u>成长值</u><b>{points}</b></div>
      <div><em style="color:{color}">{streak}天</em><u>连签</u><b>{rate}%</b></div>
    </div>
  </div>'''.format(color=color, uri=uri, name=name, role=role, pet_icon=pet_icon,
                   pet=pet, species=species, grow=grow, points=points,
                   streak=streak, rate=rate)


def main():
    av = load_avatars()
    cards = ''.join(
        card(mid, *rest, av[mid]) for mid, *rest in MEMBERS
    )
    html = u'''<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #FFF6F0; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
         padding: 16px 12px 24px; }
  .nav { text-align: center; font-size: 17px; font-weight: 600; color: #2B2320; padding: 4px 0 14px; }
  .title { font-size: 22px; font-weight: 800; color: #2B2320; margin: 0 0 12px 2px; }
  .badge { display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;
           background: #FFEBE0; color: #E06B3C; border-radius: 999px;
           padding: 3px 10px; font-size: 12px; font-weight: 700; vertical-align: 4px; }
  .row { display: flex; gap: 10px; overflow: hidden; }
  .card { flex: 0 0 178px; background: #FFF; border: 2px solid var(--c); border-radius: 14px;
          padding: 12px 12px 10px; }
  .head { display: flex; align-items: center; gap: 9px; }
  .avatar { width: 46px; height: 46px; border-radius: 50%; border: 2px solid var(--c);
            overflow: hidden; background: #F3F4F6; flex: none; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; display: block;
                border-radius: 50%; }
  .name { font-size: 16px; font-weight: 700; color: #2B2320; }
  .role { font-size: 11px; color: #9A8F86; margin-top: 2px; }
  .paw { margin-left: auto; font-size: 12px; opacity: .55; }
  .pet { display: flex; align-items: center; gap: 6px; background: #FFF3EC;
         border-radius: 8px; padding: 6px 8px; margin-top: 10px; }
  .pi { font-size: 15px; }
  .pet b { font-size: 13px; color: #3B322D; }
  .pet i { font-size: 11px; color: #A79B91; font-style: normal; }
  .bar { height: 6px; border-radius: 3px; background: #F1EBE6; margin-top: 9px; overflow: hidden; }
  .bar span { display: block; height: 100%; border-radius: 3px; background: var(--c); }
  .stats { display: flex; margin-top: 9px; }
  .stats > div { flex: 1; display: flex; flex-direction: column; align-items: center; }
  .stats em { font-size: 13px; font-weight: 800; font-style: normal; }
  .stats u { font-size: 10px; color: #A79B91; text-decoration: none; margin: 1px 0 2px; }
  .stats b { font-size: 13px; font-weight: 700; color: #2B2320; }
</style></head>
<body>
  <div class="nav">全家签到</div>
  <div class="title">全家签到<span class="badge">❤️ 今日羁绊 · 一起成长吧</span></div>
  <div class="row">__CARDS__</div>
</body></html>'''.replace('__CARDS__', cards)

    out = os.path.join(HERE, '_b64_mock.html')
    with io.open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)
    print('mock html:', out)
    print('5 张头像均由 utils/avatars.js 的真实 base64 提供')
    return out


if __name__ == '__main__':
    main()
