# match.py <reference card png> <seq dir> <prefix>: scores every frame of a build's card sequence against a reference
# (here the green card of the same run) by the overlap of their line-and-badge masks (the most saturated pixels), best first.
import sys, glob
import numpy as np
from PIL import Image, ImageFilter
def mask(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((720, 360), Image.LANCZOS)).astype(int)
    c = a.max(2) - a.min(2)
    m = c > 0.6 * np.percentile(c, 99.5)
    im = Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))
    return np.asarray(im) > 0
ref = mask(sys.argv[1])
res = []
for f in sorted(glob.glob(f'{sys.argv[2]}/{sys.argv[3]}-*.png')):
    m = mask(f); res.append(((ref & m).sum() / (ref | m).sum(), f.split('/')[-1]))
for s, f in sorted(res, reverse=True)[:16]: print(f'{s:.3f} {f}')
