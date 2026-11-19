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
    if (!images.length) return this.finish();
    for (const [key, file] of images) this.load.image(key, file);
    this.load.once('complete', () => this.finish());
    this.load.start();
  }

  finish() {
    generateArt(this);
    loadAllAvatars(this, window.AGTA.host);
    this.scene.start('Lobby');
  }
}
