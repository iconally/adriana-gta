"""Stilizuotas Vilniaus žemėlapis iš OpenStreetMap duomenų.

Paleidimas (iš projekto aplanko):
    python3 tools/make_map_osm.py tools/vilnius.json

Sukuria:
    assets/map.svg          - žemėlapio fonas (1920x1080, be užrašų)
    assets/map-layout.json  - maršruto taškų ir orientyrų vietos ekrane

Kad senamiesčio taškai nesusigrūstų, naudojama "žuvies akies" projekcija:
centras (Katedra) padidintas, pakraščiai suspausti. Gatvės ir upės - tikros.
Duomenys: (c) OpenStreetMap contributors, ODbL.
"""
import json
import math
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'tools' / 'vilnius.json'
W, H = 1920, 1080
INK = '#14081f'
random.seed(7)

# ---------------- taškai (apytiksliai; namai ir mokykla - tik rajonas) ----------------
ROUTE = [
    # Namai, mokykla, klasė ir stotelė dedami ekrane šalia ežerėlių (žr. NEAR) -
    # tik apytiksliai, kad kelias eitų be zigzagų.
    ('broliai', 'Namai', None, None),
    ('laiptai', 'Mokykla', None, None),
    ('pamoka', 'Klasė', None, None),
    ('autobusas', 'Stotelė', None, None),
    ('podiumas', 'Vingio estrada', 54.6845, 25.2405),
    ('pianinas', 'Filharmonija', 54.6772, 25.2888),
    ('kinu', 'Konfucijaus institutas', 54.6826, 25.2872),
    ('tenisas', 'Sereikiškių parkas', 54.6853, 25.2950),  # kortai tarp Gedimino kalno ir Vilnelės
    ('robotas', 'Baltasis tiltas', 54.6920, 25.2745),
    ('finalas', 'Katedros aikštė', 54.6857, 25.2876),
]
LANDMARKS = [
    ('tv', 'TV bokštas', 54.6872, 25.2147),
    ('pilis', 'Gedimino pilis', 54.6867, 25.2907),
    ('stotis', 'Stotis', 54.6705, 25.2843),
    ('dangorazdziai', '', 54.6965, 25.2760),  # be užrašo
    ('ozas', 'Ozas', 54.7133, 25.2790),
]
# Pavadinimai žemėlapyje (tikra vieta lieka "where" ir rodoma misijos kortelėje).
NAMES = {
    'broliai': 'Namai', 'laiptai': 'Mokykla', 'pamoka': 'Klasė', 'autobusas': 'Stotelė',
    'podiumas': 'Mados šou', 'pianinas': 'Piano koncertas', 'kinu': 'Kinų kalbos pamoka',
    'tenisas': 'Teniso treniruotė', 'robotas': 'Programavimo būrelis', 'finalas': 'Kalėdinis klasės vakarėlis',
}
CENTER = (54.6857, 25.2876)  # Katedra
# Ežerėliai prie namų ir taškų poslinkiai nuo jų ekrane (x, y).
LAKES = (54.7069, 25.2466)
# Mokykla ir klasė - viena vieta (taškai liečiasi), stotelė iškart šalia jų.
NEAR = {'broliai': (62, -26), 'laiptai': (-166, -6), 'pamoka': (-252, -6), 'autobusas': (-338, -6)}

LAT0 = math.radians(CENTER[0])
MX = 111320 * math.cos(LAT0)
MY = 110540


def meters(lat, lon):
    return ((lon - CENTER[1]) * MX, (lat - CENTER[0]) * MY)


class Proj:
    """Atskiras x ir y "priartinimas" centre: f(t) = a*t + b*w*tanh(t/w).
    Centre mastelis a+b, toli nuo centro - a. Gatvės lieka ištisinės,
    tik senamiestis išdidinamas, o priemiesčiai suspaudžiami."""

    def __init__(self, cx, cy, ax, bx, ay, by, w):
        self.cx, self.cy, self.ax, self.bx, self.ay, self.by, self.w = cx, cy, ax, bx, ay, by, w

    def fx(self, t):
        return self.ax * t + self.bx * self.w * math.tanh(t / self.w)

    def fy(self, t):
        return self.ay * t + self.by * self.w * math.tanh(t / self.w)

    def __call__(self, lat, lon):
        x, y = meters(lat, lon)
        return (self.cx + self.fx(x), self.cy - self.fy(y))


def fit(bbox):
    """Ieško projekcijos: visi taškai telpa ekrane, tarpai tarp jų kuo didesni,
    o žemėlapio duomenys padengia visą ekraną (be tuščių kraštų)."""
    route_pts = [(lat, lon) for _, _, lat, lon in ROUTE if lat] + [LAKES]
    lm_pts = [(lat, lon) for _, _, lat, lon in LANDMARKS]
    pts = route_pts + lm_pts
    S, Wl, N, E = bbox
    best = None
    for w in (250, 350, 500, 700):
        for ax100 in range(4, 31, 2):
            for bx100 in range(0, 101, 10):
                for ay100 in range(3, 21, 1):
                    for by100 in range(0, 101, 10):
                        P0 = Proj(0, 0, ax100 / 100, bx100 / 100, ay100 / 100, by100 / 100, w)
                        xy = [P0(*p) for p in pts]
                        minx = min(p[0] for p in xy); maxx = max(p[0] for p in xy)
                        miny = min(p[1] for p in xy); maxy = max(p[1] for p in xy)
                        if maxx - minx > 1600 or maxy - miny > 690:
                            continue
                        cx = (150 + 1770) / 2 - (minx + maxx) / 2
                        cy = (175 + 865) / 2 - (miny + maxy) / 2
                        Pj = Proj(cx, cy, P0.ax, P0.bx, P0.ay, P0.by, w)
                        # duomenys turi padengti ekraną
                        x0, _ = Pj(CENTER[0], Wl)
                        x1, _ = Pj(CENTER[0], E)
                        _, y0 = Pj(N, CENTER[1])
                        _, y1 = Pj(S, CENTER[1])
                        if x0 > 80 or x1 < 1840 or y0 > 110 or y1 < 960:
                            continue
                        r = [(p[0] + cx, p[1] + cy) for p in xy[:len(route_pts)]]
                        lm = [(p[0] + cx, p[1] + cy) for p in xy[len(route_pts):]]
                        gap = min(math.dist(a, b) for i, a in enumerate(r) for b in r[i + 1:])
                        lgap = min(math.dist(a, b) for a in r for b in lm)
                        distort = (P0.bx / max(P0.ax, 1e-3) + P0.by / max(P0.ay, 1e-3))
                        score = min(gap, 150) + min(lgap, 70) * 0.5 - distort * 4
                        if not best or score > best[0]:
                            best = (score, Pj, gap, lgap, (w, P0.ax, P0.bx, P0.ay, P0.by))
    print('projekcija w,ax,bx,ay,by =', best[4], 'min tarpas', round(best[2]), 'iki orientyrų', round(best[3]))
    return best[1]


# ---------------- duomenys ----------------
data = json.loads(SRC.read_text(encoding='utf-8'))
els = data['elements']


def geom(e):
    return [(p['lat'], p['lon']) for p in e.get('geometry', [])]


def rings_from_members(members, role):
    """Sujungia narių linijas į uždarus žiedus."""
    parts = [[(p['lat'], p['lon']) for p in m.get('geometry', [])] for m in members if m.get('role', 'outer') == role and m.get('geometry')]
    rings = []
    while parts:
        ring = parts.pop(0)
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for i, p in enumerate(parts):
                if p[0] == ring[-1]:
                    ring += p[1:]
                elif p[-1] == ring[-1]:
                    ring += p[::-1][1:]
                elif p[-1] == ring[0]:
                    ring = p[:-1] + ring
                elif p[0] == ring[0]:
                    ring = p[::-1][:-1] + ring
                else:
                    continue
                parts.pop(i)
                changed = True
                break
        rings.append(ring)
    return rings


roads = {k: [] for k in ('res', 'ter', 'sec', 'pri')}
ROAD_CLASS = {'residential': 'res', 'unclassified': 'res', 'living_street': 'res', 'pedestrian': 'res',
              'tertiary': 'ter', 'secondary': 'sec', 'primary': 'pri', 'trunk': 'pri', 'motorway': 'pri'}
rivers, rails, parks, woods, water = [], [], [], [], []
for e in els:
    t = e.get('tags', {})
    if 'highway' in t and t['highway'] in ROAD_CLASS:
        roads[ROAD_CLASS[t['highway']]].append(geom(e))
    elif t.get('waterway') == 'river':
        rivers.append(geom(e))
    elif t.get('railway') == 'rail':
        rails.append(geom(e))
    elif t.get('leisure') == 'park':
        parks.append(geom(e))
    elif t.get('landuse') == 'forest' or t.get('natural') == 'wood':
        woods.append(geom(e))
    elif t.get('natural') == 'water':
        if e['type'] == 'way':
            water.append(([geom(e)], []))
        else:
            water.append((rings_from_members(e.get('members', []), 'outer'), rings_from_members(e.get('members', []), 'inner')))

lats = [p['lat'] for e in els for p in e.get('geometry', [])]
lons = [p['lon'] for e in els for p in e.get('geometry', [])]
# duomenų ribos (šiek tiek siauresnės, kad kraštai būtų tikrai užpildyti)
P = fit((min(lats) + 0.004, min(lons) + 0.006, max(lats) - 0.004, max(lons) - 0.006))


def densify(line, step_m=40):
    out = [line[0]]
    for a, b in zip(line, line[1:]):
        ax, ay = meters(*a)
        bx, by = meters(*b)
        n = int(math.hypot(bx - ax, by - ay) // step_m)
        for k in range(1, n + 1):
            f = k / (n + 1)
            out.append((a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f))
        out.append(b)
    return out


def simplify(pts, eps=0.9):
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy)
    idx, dmax = 0, -1
    for i in range(1, len(pts) - 1):
        if L < 1e-6:  # uždaras žiedas: atstumas nuo pradžios taško
            d = math.hypot(pts[i][0] - a[0], pts[i][1] - a[1])
        else:
            d = abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L
        if d > dmax:
            idx, dmax = i, d
    if dmax <= eps:
        return [a, b]
    return simplify(pts[:idx + 1], eps)[:-1] + simplify(pts[idx:], eps)


def on_screen(xy, pad=80):
    return any(-pad < x < W + pad and -pad < y < H + pad for x, y in xy)


def path_d(lines, closed=False):
    parts = []
    for line in lines:
        if len(line) < 2:
            continue
        xy = simplify([P(*p) for p in densify(line)])
        if not on_screen(xy):
            continue
        s = 'M' + ' L'.join(f'{x:.0f} {y:.0f}' for x, y in xy)
        parts.append(s + (' Z' if closed else ''))
    return ' '.join(parts)


out = []
add = out.append
add(f'<rect width="{W}" height="{H}" fill="#150d2b"/>')
# užstatyta teritorija - švelnus fonas aplink gatves
add(f'<path d="{path_d(roads["res"] + roads["ter"])}" fill="none" stroke="#221842" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>')
add(f'<path d="{path_d(woods, True)}" fill="#14302c" stroke="#1d4a40" stroke-width="2"/>')
add(f'<path d="{path_d(parks, True)}" fill="#1a3d39" stroke="#2c5a52" stroke-width="3"/>')
# medžiai su sniegu parkuose
for poly in parks + woods:
    xy = [P(*p) for p in poly]
    if len(xy) < 3 or not on_screen(xy, 0):
        continue
    minx = min(p[0] for p in xy); maxx = max(p[0] for p in xy)
    miny = min(p[1] for p in xy); maxy = max(p[1] for p in xy)
    area = (maxx - minx) * (maxy - miny)
    for _ in range(min(18, int(area / 2500))):
        tx, ty = random.uniform(minx, maxx), random.uniform(miny, maxy)
        add(f'<circle cx="{tx:.0f}" cy="{ty:.0f}" r="3.5" fill="#f4f7ff" opacity=".55"/>')
# upės
river_d = path_d(rivers)
add(f'<path d="{river_d}" fill="none" stroke="#f4f7ff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>')
add(f'<path d="{river_d}" fill="none" stroke="#2f86c2" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>')
water_d = ' '.join(path_d(outer + inner, True) for outer, inner in water)
add(f'<path d="{water_d}" fill="#3fa7d6" fill-rule="evenodd" stroke="#f4f7ff" stroke-width="4" stroke-linejoin="round"/>')
add(f'<path d="{river_d}" fill="none" stroke="#bfe9ff" stroke-width="2" stroke-dasharray="18 40" opacity=".6"/>')
# geležinkelis
rail_d = path_d(rails)
add(f'<path d="{rail_d}" fill="none" stroke="#0e0820" stroke-width="7" stroke-linecap="round"/>')
add(f'<path d="{rail_d}" fill="none" stroke="#8b7cc0" stroke-width="3" stroke-dasharray="10 8"/>')
# gatvės
add(f'<path d="{path_d(roads["res"])}" fill="none" stroke="#33285c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
add(f'<path d="{path_d(roads["ter"])}" fill="none" stroke="#40336f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
main_d = path_d(roads['sec'] + roads['pri'])
add(f'<path d="{main_d}" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>')
add(f'<path d="{path_d(roads["sec"])}" fill="none" stroke="#54448f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>')
add(f'<path d="{path_d(roads["pri"])}" fill="none" stroke="#6b58b0" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>')
# sniegas
for _ in range(1400):
    add(f'<circle cx="{random.uniform(0, W):.0f}" cy="{random.uniform(0, H):.0f}" r="{random.uniform(.6, 2):.1f}" fill="#ffffff" opacity="{random.uniform(.06, .22):.2f}"/>')

# ---------------- orientyrų ikonos ----------------
lm_xy = {k: P(lat, lon) for k, _, lat, lon in LANDMARKS}


def icon_tv(x, y):
    return (f'<g transform="translate({x:.0f} {y:.0f})"><circle r="26" fill="#3a2f60" stroke="{INK}" stroke-width="4"/>'
            f'<line x1="0" y1="0" x2="0" y2="-70" stroke="{INK}" stroke-width="9"/><line x1="0" y1="0" x2="0" y2="-70" stroke="#c7cbe0" stroke-width="5"/>'
            f'<ellipse cx="0" cy="-48" rx="18" ry="7" fill="#c7cbe0" stroke="{INK}" stroke-width="3"/>'
            f'<line x1="0" y1="-70" x2="0" y2="-92" stroke="#ff3a6a" stroke-width="4"/><circle cy="-92" r="4" fill="#ff3a6a"/></g>')


def icon_castle(x, y):
    return (f'<g transform="translate({x:.0f} {y:.0f})"><circle r="30" fill="#24564a" stroke="#2c5a52" stroke-width="4"/>'
            f'<rect x="-12" y="-34" width="24" height="34" fill="#b0563a" stroke="{INK}" stroke-width="4"/>'
            f'<path d="M -14 -32 h 6 v -6 h 6 v 6 h 4 v -6 h 6 v 6 h 6" fill="none" stroke="{INK}" stroke-width="4"/>'
            f'<line x1="0" y1="-38" x2="0" y2="-60" stroke="{INK}" stroke-width="3"/>'
            f'<rect x="1" y="-60" width="18" height="4" fill="#ffd23f"/><rect x="1" y="-56" width="18" height="4" fill="#2ea44f"/><rect x="1" y="-52" width="18" height="4" fill="#e2333a"/></g>')


def icon_station(x, y):
    return (f'<g transform="translate({x:.0f} {y:.0f})"><rect x="-26" y="-22" width="52" height="40" rx="8" fill="#2f6bff" stroke="{INK}" stroke-width="4"/>'
            f'<rect x="-16" y="-14" width="32" height="18" rx="4" fill="#ffffff"/><circle cx="-9" cy="10" r="4" fill="#ffffff"/><circle cx="9" cy="10" r="4" fill="#ffffff"/></g>')


def icon_towers(x, y):
    hs = [(-34, 60, 22), (-8, 92, 24), (20, 74, 22), (44, 50, 18)]
    s = ''.join(f'<rect x="{dx}" y="{-h}" width="{w}" height="{h}" fill="#2a3d6e" stroke="{INK}" stroke-width="3"/>'
                + ''.join(f'<rect x="{dx + 5}" y="{-h + 8 + k * 14}" width="{w - 10}" height="5" fill="#9fd8ff" opacity=".8"/>' for k in range(h // 16))
                for dx, h, w in hs)
    return f'<g transform="translate({x:.0f} {y:.0f})">{s}</g>'


def icon_mall(x, y):
    return (f'<g transform="translate({x:.0f} {y:.0f})"><rect x="-20" y="-24" width="40" height="34" rx="6" fill="#ff3ea5" stroke="{INK}" stroke-width="4"/>'
            f'<path d="M -9 -24 Q -9 -38 0 -38 Q 9 -38 9 -24" fill="none" stroke="{INK}" stroke-width="4"/></g>')


ICONS = {'tv': icon_tv, 'pilis': icon_castle, 'stotis': icon_station, 'dangorazdziai': icon_towers, 'ozas': icon_mall}
for k, (x, y) in lm_xy.items():
    add(ICONS[k](x, y))

# vinjetė ir švytėjimas
defs = ('<radialGradient id="vig" cx="50%" cy="48%" r="72%"><stop offset="55%" stop-color="#000" stop-opacity="0"/>'
        '<stop offset="100%" stop-color="#05010d" stop-opacity=".85"/></radialGradient>'
        '<linearGradient id="glowB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3ea5" stop-opacity="0"/>'
        '<stop offset="1" stop-color="#ff3ea5" stop-opacity=".2"/></linearGradient>')
add(f'<rect width="{W}" height="{H}" fill="url(#glowB)"/>')
add(f'<rect width="{W}" height="{H}" fill="url(#vig)"/>')

svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><defs>{defs}</defs>{"".join(out)}</svg>'
(ROOT / 'assets' / 'map.svg').write_text(svg, encoding='utf-8')

# ---------------- išdėstymas žaidimui ----------------
route = {}
for rid, label, lat, lon in ROUTE:
    if lat is None:
        continue
    x, y = P(lat, lon)
    route[rid] = {'pos': [round(x), round(y)], 'place': NAMES[rid], 'where': label}
lx, ly = P(*LAKES)
for rid, label, lat, lon in ROUTE:
    if lat is None:
        dx, dy = NEAR[rid]
        route[rid] = {'pos': [round(lx + dx), round(ly + dy)], 'place': NAMES[rid], 'where': label}
route = {rid: route[rid] for rid, _, _, _ in ROUTE}
landmarks = [{'id': k, 'label': lbl, 'pos': [round(lm_xy[k][0]), round(lm_xy[k][1])]} for k, lbl, _, _ in LANDMARKS]
layout = {'route': route, 'landmarks': landmarks,
          'attribution': '© OpenStreetMap contributors'}
(ROOT / 'assets' / 'map-layout.json').write_text(json.dumps(layout, ensure_ascii=False, indent=1), encoding='utf-8')
print('map.svg', len(svg) // 1024, 'KB')
for k, v in route.items():
    print(f'  {k:10s} {v["pos"]}  {v["place"]} ({v["where"]})')
for l in landmarks:
    print(f'  * {l["label"]:14s} {l["pos"]}')
