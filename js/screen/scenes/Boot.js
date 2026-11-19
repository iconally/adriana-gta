import { generateArt } from '../art.js';
import { generateHomeArt } from '../art-home.js';
import { generateSchoolArt } from '../art-school.js';
import { generateClassArt } from '../art-class.js';
import { loadAllAvatars } from '../tribune.js';
import { ROUTE } from '../stages.js';

// Įkelia tikrus paveikslėlius iš assets/manifest.json (jei yra),
// o trūkstamus nupiešia kodu.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.json('manifest', 'assets/manifest.json');
    this.load.json('mapLayout', 'assets/map-layout.json');
  }

  create() {
    const man = this.cache.json.get('manifest') || {};
    const images = Object.entries(man.images || {}).filter(([k, f]) => k && f && !k.startsWith('_'));
    for (const [key, file] of images) this.load.image(key, file);
    const own = new Set(images.map(([k]) => k));
    // Logotipas ir žemėlapis - SVG, nebent manifest.json nurodo kitą failą.
    if (!own.has('logo')) this.load.svg('logo', 'assets/logo.svg', { width: 1200, height: 700 });
    if (!own.has('map')) this.load.svg('map', 'assets/map.svg', { width: 1920, height: 1080 });
    this.load.once('complete', () => this.finish());
    this.load.start();
  }

  finish() {
    // Tikro žemėlapio taškų vietos ir pavadinimai (tools/make_map_osm.py).
    const lay = this.cache.json.get('mapLayout');
    if (lay && lay.route) {
      for (const r of ROUTE) {
        const v = lay.route[r.id];
        if (v) { r.pos = v.pos; r.place = v.place; r.where = v.where || v.place; }
      }
    }
    generateArt(this);
    generateHomeArt(this);
    generateSchoolArt(this);
    generateClassArt(this);
    loadAllAvatars(this, window.AGTA.host);
    this.scene.start('Lobby');
  }
}
