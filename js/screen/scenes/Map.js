// Žemėlapis tarp etapų: Adrianos dienos maršrutas per Vilnių,
// žyma "JŪS ESATE ČIA" ir kitos misijos kortelė.

import { headText, bodyText, subtitle, snow, C } from '../fx.js';
import { Tribune } from '../tribune.js';
import { LOBBY, ROUTE } from '../stages.js';

const LAST = ROUTE.length - 1;
// Orientyrų piktogramų ribos žemėlapyje (žr. tools/make_map_osm.py): viršus, apačia, x poslinkis, pusė pločio.
const ICON_BOX = {
  tv: [-96, 28, 0, 26], pilis: [-62, 32, 0, 30], stotis: [-24, 20, 0, 26], dangorazdziai: [-94, 0, 14, 48], ozas: [-40, 12, 0, 20],
};
const radOf = (i) => (i === LAST ? 44 : 34);
const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0))
  * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
const PANEL_W = 620;
const PANEL_H = 196;
const tOf = (i) => i / LAST;

export class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    A.host.setPhase('lobby', LOBBY);

    this.add.image(960, 540, 'map').setDisplaySize(1920, 1080).setDepth(-100);
    this.layout = this.cache.json.get('mapLayout') || null;
    this.drawLandmarks();
    snow(this, 500);

    this.curve = new Phaser.Curves.Spline(ROUTE.map((r) => new Phaser.Math.Vector2(r.pos[0], r.pos[1])));
    this.samples = this.curve.getPoints(LAST * 40);
    this.routeGfx = this.add.graphics().setDepth(10);
    this.points = ROUTE.map((r, i) => this.makePoint(r, i));
    this.placeLabels();

    const next = this.nextIndex();
    this.at = next === -1 ? LAST : Math.max(0, next - 1);
    this.travel = tOf(this.at);
    this.makeMarker();
    this.placeMarker(this.travel);
    this.makePanel();
    this.refreshPoints();
    this.drawRoute();

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.ready = null;

    this.input.keyboard.on('keydown-ENTER', () => this.onEnter());
    const off = A.host.on('press', (e) => this.onPress(e));
    this.events.once('shutdown', off);
    this.time.addEvent({
      delay: 11000, loop: true,
      callback: () => subtitle(this, A.lines.pick('common', 'map'), { color: '#f1e6ff', y: 930 }),
    });

    this.time.delayedCall(700, () => this.advance());
  }

  nextIndex() {
    return ROUTE.findIndex((r) => !this.A.host.done.has(r.id));
  }

  // ---------------- eiga ----------------
  advance() {
    const next = this.nextIndex();
    if (next === -1) { this.allDone(); return; }
    if (next === this.at && this.travel === tOf(next)) { this.arrive(next); return; }
    this.moveTo(next, () => this.arrive(next));
  }

  moveTo(i, done) {
    const from = this.travel;
    const to = tOf(i);
    const dur = Math.min(2200, 700 + Math.abs(to - from) * LAST * 450);
    this.tweens.addCounter({
      from: 0, to: 1, duration: dur, ease: 'Sine.InOut',
      onUpdate: (tw) => {
        this.travel = from + (to - from) * tw.getValue();
        this.placeMarker(this.travel);
        this.drawRoute();
      },
      onComplete: () => {
        this.at = i;
        this.travel = to;
        done();
      },
    });
  }

  arrive(i) {
    const stage = ROUTE[i];
    this.refreshPoints(i);
    this.showPanel(stage);
    if (!stage.scene) {
      this.ready = null;
      this.panelAction.setText('Kuriama... važiuojam toliau').setColor(C.orange);
      subtitle(this, this.A.lines.pick('common', 'skip', { vieta: stage.place }), { color: C.orange, y: 930 });
      this.time.delayedCall(1500, () => {
        this.A.host.markDone(stage.id);
        this.advance();
      });
      return;
    }
    this.ready = stage;
    this.panelAction.setText('ENTER - PRADĖTI MISIJĄ').setColor(C.white);
    this.A.sfx.pop();
  }

  allDone() {
    this.ready = null;
    this.refreshPoints(-1);
    this.panelKicker.setText('VILNIUS');
    this.panelTitle.setText('VISOS MISIJOS ĮVYKDYTOS!');
    this.panelDesc.setText('ESC - į laukiamąjį');
    this.panelAction.setText('');
  }

  onEnter() {
    if (!this.ready) return;
    this.A.go(this.ready.scene);
  }

  onPress({ player, action }) {
    if (action === 'labas') {
      this.tribune.bounce(player.pid);
      this.tribune.bubble(player.pid, this.A.lines.pick('common', 'labas'));
    } else {
      this.tribune.wiggle(player.pid);
      this.tribune.bubble(player.pid, '♪ ♫', C.teal);
    }
  }

  // ---------------- piešimas ----------------
  drawRoute() {
    const g = this.routeGfx;
    const pts = this.samples;
    const cut = Math.round(this.travel * (pts.length - 1));
    g.clear();
    g.lineStyle(20, 0x14081f, 0.85);
    g.strokePoints(pts);
    for (let i = cut; i < pts.length - 1; i++) {
      if (i % 4 < 2) {
        g.lineStyle(8, 0xff3ea5, 1);
        g.lineBetween(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
      }
    }
    if (cut > 0) {
      g.lineStyle(10, 0xffd23f, 1);
      g.strokePoints(pts.slice(0, cut + 1));
    }
  }

  makePoint(r, i) {
    const box = this.add.container(r.pos[0], r.pos[1]).setDepth(20);
    const big = i === LAST;
    const rad = radOf(i);
    const ring = this.add.circle(0, 0, rad + 10, 0xff3ea5, 0.35).setVisible(false);
    const disc = this.add.circle(0, 0, rad, 0xffffff).setStrokeStyle(6, 0x14081f);
    const icon = this.add.text(0, 2, r.icon, { fontSize: `${big ? 44 : 34}px` }).setOrigin(0.5);
    const badge = this.add.circle(rad * 0.78, -rad * 0.78, 16, 0xffd23f).setStrokeStyle(4, 0x14081f);
    const nr = this.add.text(rad * 0.78, -rad * 0.78 + 1, String(r.nr), {
      fontFamily: 'Rubik, Arial, sans-serif', fontStyle: 'bold', fontSize: '18px', color: '#14081f',
    }).setOrigin(0.5);
    const check = this.add.circle(-rad * 0.78, -rad * 0.78, 16, 0x3ddc84).setStrokeStyle(4, 0x14081f).setVisible(false);
    const tick = this.add.text(-rad * 0.78, -rad * 0.78 + 1, '✓', {
      fontFamily: 'Rubik, Arial, sans-serif', fontStyle: 'bold', fontSize: '20px', color: '#14081f',
    }).setOrigin(0.5).setVisible(false);
    const label = bodyText(this, 0, rad + 24, r.place, 22, C.white);
    box.add([ring, disc, icon, badge, nr, check, tick, label]);
    return { box, ring, check, tick, disc, label };
  }

  refreshPoints(current = -1) {
    const done = this.A.host.done;
    ROUTE.forEach((r, i) => {
      const p = this.points[i];
      const isDone = done.has(r.id);
      const isCur = i === current;
      p.check.setVisible(isDone);
      p.tick.setVisible(isDone);
      p.box.setAlpha(isDone && !isCur ? 0.75 : 1);
      p.disc.setFillStyle(r.scene || isDone ? 0xffffff : 0xd9d2ee);
      this.tweens.killTweensOf(p.ring);
      p.ring.setVisible(isCur).setScale(1).setAlpha(0.35);
      if (isCur) this.tweens.add({ targets: p.ring, scale: 1.5, alpha: 0, duration: 900, repeat: -1 });
      p.box.setScale(isCur ? 1.12 : 1);
    });
  }

  makeMarker() {
    const box = this.add.container(0, 0).setDepth(40);
    const inner = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(0x14081f, 1);
    g.fillTriangle(-22, -70, 22, -70, 0, -6);
    g.fillCircle(0, -86, 50);
    g.fillStyle(0xff3ea5, 1);
    g.fillTriangle(-16, -72, 16, -72, 0, -14);
    g.fillCircle(0, -86, 44);
    const face = this.textures.exists('adr_face');
    const head = this.add.image(0, -86, face ? 'adr_face' : 'adr_head');
    if (face) head.setDisplaySize(78, 78);
    else head.setScale(0.62).setOrigin(0.5, 0.58);
    const tagBg = this.add.rectangle(0, -168, 236, 46, 0x14081f, 0.92).setStrokeStyle(4, 0xffd23f);
    const tag = headText(this, 0, -169, 'JŪS ESATE ČIA', 30, C.yellow, { strokeThickness: 0 });
    tag.setShadow(0, 0, 'rgba(0,0,0,0)');
    inner.add([g, head, tagBg, tag]);
    this.markerTag = [tagBg, tag];
    box.add(inner);
    this.tweens.add({ targets: inner, y: -10, yoyo: true, repeat: -1, duration: 650, ease: 'Sine.InOut' });
    this.marker = box;
  }

  placeMarker(t) {
    const p = this.curve.getPoint(Phaser.Math.Clamp(t, 0, 1));
    this.marker.setPosition(p.x, p.y - 30);
    // Prie viršutinio krašto užrašas "JŪS ESATE ČIA" eina į šoną, kad neišlįstų už ekrano.
    const side = p.y < 240 ? (p.x > 960 ? -1 : 1) : 0;
    const tx = side * 182;
    const ty = side ? -86 : -168;
    this.markerTag[0].setPosition(tx, ty);
    this.markerTag[1].setPosition(tx, ty - 1);
  }

  // Taško užrašas dedamas po tašku, šone arba virš jo - kur mažiausiai užlipa ant kitų.
  placeLabels() {
    const obst = ROUTE.map((r, i) => {
      const k = radOf(i) + 6;
      return { x0: r.pos[0] - k, y0: r.pos[1] - k, x1: r.pos[0] + k, y1: r.pos[1] + k };
    }).concat(this.landmarkBoxes);
    ROUTE.forEach((r, i) => {
      const { label } = this.points[i];
      const rad = radOf(i);
      const w = label.width;
      const h = label.height;
      const cands = [[0, rad + 24, 0], [rad + 12 + w / 2, 6, 40], [-(rad + 12 + w / 2), 6, 40], [0, -(rad + 34), 80]];
      let best = null;
      for (const [dx, dy, pen] of cands) {
        const cx = r.pos[0] + dx;
        const cy = r.pos[1] + dy;
        const b = { x0: cx - w / 2 - 4, y0: cy - h / 2, x1: cx + w / 2 + 4, y1: cy + h / 2 };
        let cost = pen;
        for (const o of obst) cost += overlap(b, o);
        if (b.x0 < 8 || b.x1 > 1912 || b.y0 < 8 || b.y1 > 945) cost += 1e5;
        if (!best || cost < best.cost) best = { cost, dx, dy, b };
      }
      label.setPosition(best.dx, best.dy);
      obst.push(best.b);
    });
  }

  drawLandmarks() {
    this.landmarkBoxes = [];
    const lay = this.layout;
    if (!lay) return;
    for (const l of lay.landmarks || []) {
      const [top, bottom, dx, hw] = ICON_BOX[l.id] || [-40, 20, 0, 26];
      const x = l.pos[0] + dx;
      this.landmarkBoxes.push({ x0: x - hw, y0: l.pos[1] + top, x1: x + hw, y1: l.pos[1] + bottom });
      const opts = [l.pos[1] + bottom + 18, l.pos[1] + top - 16];
      const near = (y) => Math.min(...ROUTE.map((r) => Math.hypot(r.pos[0] - x, r.pos[1] + 30 - y)));
      const y = near(opts[0]) >= near(opts[1]) || near(opts[0]) > 110 ? opts[0] : opts[1];
      const t = bodyText(this, x, y, l.label, 18, '#d9c8ff').setAlpha(0.9).setDepth(5);
      this.landmarkBoxes.push({ x0: x - t.width / 2, y0: y - t.height / 2, x1: x + t.width / 2, y1: y + t.height / 2 });
    }
    if (lay.attribution) {
      this.add.text(1910, 1074, lay.attribution, {
        fontFamily: 'Rubik, Arial, sans-serif', fontSize: '13px', color: '#cbbbe6',
      }).setOrigin(1, 1).setAlpha(0.7).setDepth(700);
    }
  }

  // Kortelė dedama į tą kampą, kuriame mažiausiai maršruto taškų ir orientyrų.
  panelSpot() {
    const cands = [[40, 40], [1920 - 40 - PANEL_W, 40], [40, 890 - PANEL_H], [1920 - 40 - PANEL_W, 890 - PANEL_H]];
    const obst = ROUTE.map((r) => ({ x: r.pos[0], y: r.pos[1] + 20, r: 75 }));
    for (const l of (this.layout && this.layout.landmarks) || []) obst.push({ x: l.pos[0], y: l.pos[1] - 20, r: 55 });
    const hits = ([x, y]) => obst.filter((o) => {
      const dx = Math.max(x - o.x, 0, o.x - (x + PANEL_W));
      const dy = Math.max(y - o.y, 0, o.y - (y + PANEL_H));
      return dx * dx + dy * dy < o.r * o.r;
    }).length;
    let best = cands[0];
    for (const c of cands) if (hits(c) < hits(best)) best = c;
    return best;
  }

  makePanel() {
    const [x, y] = this.panelSpot();
    const box = this.add.container(x, y).setDepth(60);
    const bg = this.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x0b0418, 0.88).setOrigin(0).setStrokeStyle(5, 0xff3ea5);
    this.panelKicker = headText(this, 26, 38, '', 28, C.teal, { strokeThickness: 0 }).setOrigin(0, 0.5);
    this.panelTitle = headText(this, 26, 90, '', 52, C.yellow).setOrigin(0, 0.5);
    this.panelDesc = bodyText(this, 26, 138, '', 24, C.white, { align: 'left', wordWrap: { width: PANEL_W - 50 } }).setOrigin(0, 0.5);
    this.panelAction = headText(this, 26, 172, '', 28, C.white, { strokeThickness: 0 }).setOrigin(0, 0.5);
    this.tweens.add({ targets: this.panelAction, alpha: 0.35, yoyo: true, repeat: -1, duration: 650 });
    box.add([bg, this.panelKicker, this.panelTitle, this.panelDesc, this.panelAction]);
  }

  showPanel(stage) {
    const where = stage.where || stage.place;
    this.panelKicker.setText(`MISIJA ${stage.nr}  ·  ${where.toUpperCase()}`);
    const kmax = PANEL_W - 50;
    this.panelKicker.setScale(this.panelKicker.width > kmax ? kmax / this.panelKicker.width : 1);
    this.panelTitle.setText(stage.mission);
    // Jei tikra vieta jau pasako pavadinimą (Namai, Stotelė prie Akropolio), rodom etapo pavadinimą.
    this.panelDesc.setText(where.toLowerCase().includes(stage.place.toLowerCase()) ? stage.title : stage.place);
    const max = PANEL_W - 50;
    const fit = this.panelTitle.width > max ? max / this.panelTitle.width : 1;
    this.panelTitle.setScale(fit);
  }
}
