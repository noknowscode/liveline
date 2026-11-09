# Crops the raw session captures into src/cap/ at their stored scale. Only ever downscales: a stored scale above the
# capture's device pixel ratio is refused, so nothing in cap/ is enlarged.
#   python3 crop.py <raw dir> <cap dir> [names...]
# Rects are CSS px of the captured page (x, y, w, h), or None for the whole capture.
import sys, os
from PIL import Image
RAW, CAP = sys.argv[1], sys.argv[2]
# name: (raw capture under RAW, its DPR, rect, stored scale)
CROPS = {
  # Sessions on studio 9de40e5 (the live dot draws), entropy seed 2026, start-up in 30 x 20 ms clock steps; the feed's
  # value is 140.33 for frames 544-552. L (Light) and D (Dark) shot every device inside that tick: desktop frame 547,
  # tablet 548, landscape 549, phone 550, card 551 (line masks agree across the themes: 0.91-0.94).
  'light-desk@2x':   ('L/light-desk.png', 3, None, 2),
  'light-tab@2x':    ('L/light-tab.png', 3, None, 2),
  'dark-tab@2x':     ('D/dark-tab.png', 3, None, 2),
  'light-land@2x':   ('L/light-land.png', 3, None, 2),
  'dark-land@2x':    ('D/dark-land.png', 3, None, 2),
  'light-phone@2x':  ('L/light-phone.png', 3, None, 2),
  'dark-phone@2x':   ('D/dark-phone.png', 3, None, 2),
  # The page around the card at desk size, for the diagonal split (CSS 1120x640 page)
  'light-split@3x':  ('L/light-desk.png', 3, (120, 60, 880, 520), 3),
  'dark-split@3x':   ('D/dark-desk.png', 3, (120, 60, 880, 520), 3),
  # The card alone (760x420 page, card at 20,30), inside its 1 px OutlineVariant edge
  'light-card@3x':   ('L/light-card.png', 3, (1, 1, 718, 358), 3),
  # Theming deck: the shipped build and three seed builds, each run as a 14-frame card sequence (frames 542-555); the
  # frames used are the ones whose line matches the green frame chosen (see match.py). Filled in below.
  # DPR 5 card session HL (Light), frame 550: the plot through the badge (line, fill, tracking line, live dot, badge,
  # value labels), no time labels, inside the card's rounded corners (their 1 px edge arcs would show through the falloff)
  'light-plot@5x':   ('HL/light-card5.png', 5, (16, 16, 692, 313), 5),
  # Macro session M (600x420 page at DPR 6, Dark), frame 550: the plot's right end, the live dot, the badge and labels
  'dark-macro@6x':   ('M/dark-macro-000.png', 6, (300, 30, 300, 260), 6),
  # Mid-move sequence S1 (Dark, the 1120x640 page, clip 740x380 at DPR 3 with the card at 10,10), a shot
  # every 2 frames from frame 144: index i is frame 144 + 2i. Index 1 (frame 146) is the spike's badge mid-glide.
  'dark-ease@3x':    ('S1/mid-001.png', 3, (210, 11, 519, 358), 3),
  # Theming deck: frame 551 of each card sequence (index 009) unless noted; line masks match the green one at 0.97-0.99
  'light-card-green@2x': ('SQg/light-card-009.png', 3, (1, 1, 718, 358), 2),
  'dark-card-blue@2x':   ('SQb/dark-card-009.png', 3, (1, 1, 718, 358), 2),
  'light-card-orange@2x': ('SQo/light-card-008.png', 3, (1, 1, 718, 358), 2),   # this run's start-up was one frame later
  'dark-card-purple@2x':  ('SQp/dark-card-009.png', 3, (1, 1, 718, 358), 2),
}
for i in (1, 3, 14, 18, 30):
  CROPS[f'dark-step{i:02d}@2x'] = (f'S1/mid-{i:03d}.png', 3, (510, 11, 219, 319), 2)
only = sys.argv[3:]
os.makedirs(CAP, exist_ok=True)
for name, (src, dpr, rect, scale) in CROPS.items():
  if only and name not in only: continue
  assert scale <= dpr, name
  p = os.path.join(RAW, src)
  if not os.path.exists(p): print('missing', name, src); continue
  im = Image.open(p).convert('RGB')
  if rect:
    x, y, w, h = rect
    im = im.crop((x * dpr, y * dpr, (x + w) * dpr, (y + h) * dpr))
  if scale != dpr:
    im = im.resize((round(im.width * scale / dpr), round(im.height * scale / dpr)), Image.LANCZOS)
  im.save(os.path.join(CAP, name + '.png'), optimize=True)
  print(name, im.size)
