import { generateArt } from '../art.js';
import { loadAllAvatars } from '../tribune.js';

// Įkelia tikrus paveikslėlius iš assets/manifest.json (jei yra),
// o trūkstamus nupiešia kodu.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.json('manifest', 'assets/manifest.json');
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
    generateArt(this);
    loadAllAvatars(this, window.AGTA.host);
    this.scene.start('Lobby');
  }
}
