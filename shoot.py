"""Take the entry's 3 screenshots: the app on live make.fun data in headless Chromium.

Shots wait for window.__shotReady (set by the app once a route's data has rendered).
JPEG quality 80 keeps each well under the gate's 256 KiB cap.
"""
import sys
from playwright.sync_api import sync_playwright

out_dir = sys.argv[1] if len(sys.argv) > 1 else 'screenshots'
base = 'http://localhost:8123'
shots = [
    ('1-board.jpg', '#/', 1280, 900),
    ('2-bounty.jpg', '#/bounty/makefun-frontend-01', 1280, 900),
    ('3-leaderboard.jpg', '#/leaderboard/token-radar-01', 1280, 900),
]

with sync_playwright() as pw:
    b = pw.chromium.launch()
    page = b.new_page(viewport={'width': 1280, 'height': 900}, device_scale_factor=1)
    for name, route, w, h in shots:
        page.set_viewport_size({'width': w, 'height': h})
        page.goto(base + '/index.html' + route)
        page.wait_for_function('window.__shotReady === true', timeout=30000)
        page.wait_for_timeout(700)  # let images and fonts settle
        page.screenshot(path=f'{out_dir}/{name}', full_page=False, type='jpeg', quality=80)
        print('shot', name)
    b.close()
print('done')
