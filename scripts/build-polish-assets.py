"""Package supplied raster-in-SVG art without repainting canonical pixels.

Requires Pillow only for reading PNG alpha bounds. Originals remain unchanged.
"""
from pathlib import Path
import base64
import io
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/polish'
OUT.mkdir(parents=True, exist_ok=True)

def embedded(path):
    return re.search(r'data:image/[^;]+;base64,[^"\s]+', path.read_text())[0]

poses = ['idle', 'race-steady', 'race-turbo', 'happy', 'surprised', 'celebrate',
         'greeting', 'curious', 'confident', 'sled-ready', 'race-fast', 'leaning-turn',
         'deep-snow', 'recover', 'look-back', 'encouragement', 'finish-push', 'proud']
parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480">']
for i, pose in enumerate(poses):
    uri = embedded(ROOT / f'public/assets/characters/husky/husky-{pose}.svg')
    im = Image.open(io.BytesIO(base64.b64decode(uri.split(',')[1])))
    box = im.getbbox()
    l, t, r, b = box
    scale = min(184 / (r-l), 126 / (b-t))
    x = (i % 6)*200 + 100 - ((l+r)/2)*scale
    y = (i // 6)*160 + 134 - b*scale
    parts.append(f'<image x="{x}" y="{y}" width="{im.width*scale}" height="{im.height*scale}" href="{uri}"/>')
parts.append('</svg>')
(OUT/'husky-canonical-atlas.svg').write_text(''.join(parts))

# Feather the opaque vignette boundaries, preserving the illustration itself.
for path in (ROOT/'public/assets/worlds/snowy-peaks').glob('*.svg'):
    if path.stem in ['map-backdrop', 'race-backdrop', 'fx-snowspray']:
        continue
    s = path.read_text()
    w, h = re.search(r'viewBox="0 0 (\d+) (\d+)"', s).groups()
    uri = embedded(path)
    (OUT/path.name).write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
    <defs><radialGradient id="fade"><stop offset="55%" stop-color="white"/><stop offset="82%" stop-color="white" stop-opacity=".92"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient>
    <mask id="edge"><rect width="{w}" height="{h}" fill="url(#fade)"/></mask></defs>
    <image width="{w}" height="{h}" href="{uri}" mask="url(#edge)"/></svg>''')

uri = embedded(ROOT/'public/assets/worlds/snowy-peaks/sign-blank-carved.svg')
(OUT/'wood-panel.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="620" height="160" viewBox="102 186 314 87"><image width="512" height="512" href="{uri}"/></svg>')
print('Packaged Husky atlas, 20 feathered vignettes and wooden UI surface.')

# Phaser's SVG loader needs explicit intrinsic dimensions for these supplied
# viewBox-only reward files. Preserve every original drawing element/pixel.
for name, source in {
    'husky-friendship': 'characters/husky/husky-friendship.svg',
    'husky-sticker-final': 'rewards/husky/husky-sticker-v2.svg',
    'husky-sticker-golden': 'rewards/husky/husky-sticker-golden-v2.svg',
    'husky-greeting': 'characters/husky/husky-greeting.svg',
}.items():
    s = (ROOT/'public/assets'/source).read_text()
    w, h = re.search(r'viewBox="0 0 (\d+) (\d+)"', s).groups()
    s = s.replace('<svg ', f'<svg width="{w}" height="{h}" ', 1)
    (OUT/f'{name}.svg').write_text(s)
# Keep the complete portrait inside the existing sticker circle instead of
# clipping the ears and face at its top edge (layout only, no repainting).
for name in ['husky-sticker-final', 'husky-sticker-golden']:
    p = OUT/f'{name}.svg'
    s = p.read_text()
    s = s.replace('x="90" y="9" width="300" height="483"', 'x="157" y="113" width="166" height="267"')
    p.write_text(s)

# Normalize transparent padding in Kiki's existing canonical atlas. Frames and
# approved pixels remain unchanged; all poses share the same grounded baseline.
kiki_sources = ['idle','trot','trot','trot','trot','run','run','curious','surprised','happy','thinking','curious','curious','sniff','jump','shiver','curious','success','confused','sled-ready','race-steady','race-turbo','race-steady','confused','celebrate','proud','sticker']
parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">']
for i, pose in enumerate(kiki_sources):
    uri = embedded(ROOT/f'public/assets/characters/kiki/kiki-a-{pose}.svg')
    im = Image.open(io.BytesIO(base64.b64decode(uri.split(',')[1])))
    l,t,r,b = im.getbbox()
    scale = min(184/(r-l),126/(b-t))
    x = (i%6)*200+100-((l+r)/2)*scale
    y = (i//6)*160+134-b*scale
    parts.append(f'<image x="{x}" y="{y}" width="{im.width*scale}" height="{im.height*scale}" href="{uri}"/>')
parts.append('</svg>')
(OUT/'kiki-canonical-atlas.svg').write_text(''.join(parts))
