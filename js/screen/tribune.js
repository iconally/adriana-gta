// Avatarų tekstūros ir "tribūna" - juosta ekrano apačioje,
// kurioje kiekvienas prisijungęs vaikas mato save.

import { bodyText, C } from './fx.js';

export const avatarKey = (name) => `av:${name}`;
const pending = new Set();

export function ensureAvatar(scene, name, dataUrl) {
  const key = avatarKey(name);
  if (scene.textures.exists(key)) return key;
  if (dataUrl && !pending.has(key)) {
    pending.add(key);
    scene.textures.once(`addtexture-${key}`, () => pending.delete(key));
    scene.textures.addBase64(key, dataUrl);
  }
  return null;
}

export function loadAllAvatars(scene, host, { reload = false } = {}) {
  for (const kid of host.roster.kids) {
    if (reload && scene.textures.exists(avatarKey(kid.name))) scene.textures.remove(avatarKey(kid.name));
    ensureAvatar(scene, kid.name, kid.avatar);
  }
  if (host.roster.adriana) {
    if (reload && scene.textures.exists('adr_face')) scene.textures.remove('adr_face');
    if (!scene.textures.exists('adr_face') && !pending.has('adr_face')) {
      pending.add('adr_face');
      scene.textures.once('addtexture-adr_face', () => pending.delete('adr_face'));
      scene.textures.addBase64('adr_face', host.roster.adriana);
    }
  }
}

export class Tribune {
  constructor(scene, host, { y = 1030, maxSize = 84, names = true, band = true } = {}) {
    this.scene = scene;
    this.host = host;
    this.y = y;
    this.maxSize = maxSize;
    this.names = names;
    this.items = new Map();
    this.size = maxSize;
    if (band) {
      scene.add.rectangle(960, y + 8, 1920, maxSize + (names ? 46 : 24), 0x0b0418, 0.6).setDepth(600);
    }
    const offs = [
      host.on('players', () => this.refresh()),
    ];
    const onTex = (key) => { if (String(key).startsWith('av:')) this.refreshImages(); };
    scene.textures.on('addtexture', onTex);
    offs.push(() => scene.textures.off('addtexture', onTex));
    scene.events.once('shutdown', () => offs.forEach((f) => f()));
    this.refresh();
  }

  refresh() {
    const list = this.host.list();
    const alive = new Set(list.map((p) => p.pid));
    for (const [pid, it] of this.items) {
      if (!alive.has(pid)) { it.box.destroy(); this.items.delete(pid); }
    }
    const n = list.length;
    const gap = 10;
    this.size = Math.max(40, Math.min(this.maxSize, (1840 - (n - 1) * gap) / Math.max(n, 1)));
    const total = n * this.size + (n - 1) * gap;
    let x = 960 - total / 2 + this.size / 2;
    for (const p of list) {
      let it = this.items.get(p.pid);
      if (!it) {
        it = this.create(p);
        this.items.set(p.pid, it);
        it.box.setScale(0);
        this.scene.tweens.add({ targets: it.box, scale: 1, duration: 380, ease: 'Back.Out' });
      }
      it.box.setPosition(x, this.y);
      it.img.setDisplaySize(this.size, this.size);
      if (it.label) {
        it.label.setY(this.size / 2 + 14);
        it.label.setVisible(this.size >= 56);
        it.label.setFontSize(this.size >= 76 ? 18 : 15);
      }
      it.box.setAlpha(this.host.isOnline(p) || !p.lastSeen ? 1 : 0.45);
      x += this.size + gap;
    }
  }

  create(p) {
    const key = this.scene.textures.exists(avatarKey(p.name)) ? avatarKey(p.name) : 'dot';
    const box = this.scene.add.container(0, this.y).setDepth(610);
    const img = this.scene.add.image(0, 0, key);
    if (key === 'dot') img.setTint(0x5a2a86);
    box.add(img);
    let label = null;
    if (this.names) {
      label = bodyText(this.scene, 0, 0, p.name, 18, C.white).setOrigin(0.5, 0);
      box.add(label);
    }
    return { box, img, label, name: p.name };
  }

  refreshImages() {
    for (const it of this.items.values()) {
      const key = avatarKey(it.name);
      if (this.scene.textures.exists(key) && it.img.texture.key !== key) {
        it.img.setTexture(key).clearTint().setDisplaySize(this.size, this.size);
      }
    }
  }

  pos(pid) {
    const it = this.items.get(pid);
    if (!it) return { x: 960, y: this.y };
    return { x: it.box.x, y: it.box.y - this.size / 2 };
  }

  bounce(pid) {
    const it = this.items.get(pid);
    if (!it) return;
    this.scene.tweens.killTweensOf(it.box);
    it.box.setScale(1).setAngle(0);
    this.scene.tweens.add({ targets: it.box, scale: 1.3, y: this.y - 16, yoyo: true, duration: 140, ease: 'Quad.Out', onComplete: () => it.box.setY(this.y) });
  }

  wiggle(pid) {
    const it = this.items.get(pid);
    if (!it) return;
    this.scene.tweens.killTweensOf(it.box);
    it.box.setScale(1).setY(this.y);
    this.scene.tweens.add({ targets: it.box, angle: { from: -14, to: 14 }, yoyo: true, repeat: 2, duration: 110, onComplete: () => it.box.setAngle(0) });
  }

  bubble(pid, text, color = C.yellow) {
    const { x, y } = this.pos(pid);
    // kaimynų burbulai išdėstomi skirtingame aukštyje, kad nesusilietų
    const idx = [...this.items.keys()].indexOf(pid);
    const lift = (idx % 3) * 34;
    const t = bodyText(this.scene, x, y - 24 - lift, text, 26, color).setDepth(860).setOrigin(0.5, 1);
    t.setScale(0.4);
    this.scene.tweens.add({ targets: t, scale: 1, y: y - 40 - lift, duration: 220, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 1300, duration: 300, onComplete: () => t.destroy() });
  }
}
