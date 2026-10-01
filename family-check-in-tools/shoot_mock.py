"""按 375px 视口渲染 _mock.html 并截图（2x），用于肉眼核查头像显示。"""
import os
from playwright.sync_api import sync_playwright

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'family-check-in-mini')
HTML = os.path.join(BASE, 'tools', '_mock.html')
OUT = os.path.join(BASE, 'tools', '_mock_shot.png')

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 375, 'height': 900}, device_scale_factor=2)
    pg.goto('file:///' + HTML.replace('\\', '/'))
    pg.wait_for_timeout(600)
    pg.screenshot(path=OUT, full_page=True)
    b.close()
print('SAVED', OUT)
