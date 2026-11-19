// Žemėlapis tarp etapų: Adrianos dienos maršrutas per Vilnių,
// žyma "JŪS ESATE ČIA" ir kitos misijos kortelė.

import { headText, bodyText, subtitle, snow, C } from '../fx.js';
import { Tribune } from '../tribune.js';
import { LOBBY, ROUTE } from '../stages.js';

const LAST = ROUTE.length - 1;
const tOf = (i) => i / LAST;

export class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    A.host.setPhase('lobby', LOBBY);

    this.add.image(960, 540, 'map').setDisplaySize(1920, 1080).setDepth(-100);
    snow(this, 500);

    this.curve = new Phaser.Curves.Spline(ROUTE.map((r) => new Phaser.Math.Vector2(r.pos[0], r.pos[1])));
    this.samples = this.curve.getPoints(LAST * 40);
    this.routeGfx = this.add.graphics().setDepth(10);
    this.points = ROUTE.map((r, i) => this.makePoint(r, i));

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
    const rad = big ? 44 : 34;
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
    return { box, ring, check, tick, disc };
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
    box.add(inner);
    this.tweens.add({ targets: inner, y: -10, yoyo: true, repeat: -1, duration: 650, ease: 'Sine.InOut' });
    this.marker = box;
  }

  placeMarker(t) {
    const p = this.curve.getPoint(Phaser.Math.Clamp(t, 0, 1));
    this.marker.setPosition(p.x, p.y - 30);
  }

  makePanel() {
    const x = 40;
    const y = 40;
    const box = this.add.container(x, y).setDepth(60);
    const bg = this.add.rectangle(0, 0, 700, 236, 0x0b0418, 0.85).setOrigin(0).setStrokeStyle(5, 0xff3ea5);
    this.panelKicker = headText(this, 28, 44, '', 32, C.teal, { strokeThickness: 0 }).setOrigin(0, 0.5);
    this.panelTitle = headText(this, 28, 104, '', 58, C.yellow).setOrigin(0, 0.5);
    this.panelDesc = bodyText(this, 28, 160, '', 26, C.white, { align: 'left', wordWrap: { width: 650 } }).setOrigin(0, 0.5);
    this.panelAction = headText(this, 28, 206, '', 32, C.white, { strokeThickness: 0 }).setOrigin(0, 0.5);
    this.tweens.add({ targets: this.panelAction, alpha: 0.35, yoyo: true, repeat: -1, duration: 650 });
    box.add([bg, this.panelKicker, this.panelTitle, this.panelDesc, this.panelAction]);
  }

  showPanel(stage) {
    this.panelKicker.setText(`MISIJA ${stage.nr}  ·  ${stage.place.toUpperCase()}`);
    this.panelTitle.setText(stage.mission);
    this.panelDesc.setText(stage.title);
    const fit = this.panelTitle.width > 650 ? 650 / this.panelTitle.width : 1;
    this.panelTitle.setScale(fit);
  }
}
