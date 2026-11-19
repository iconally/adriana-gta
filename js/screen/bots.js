// Virtualūs vaikai: užpildo klasę ir spaudo mygtukus, kad žaidimą
// būtų galima matyti pilną be telefonų (kūrimui ir repeticijoms).
// Visada prisijungia ir virtuali mokytoja: jei klasės sąraše jos nėra,
// laikinai pridedama "Mokytoja" (išimant virtualius vaikus - pašalinama).

import { placeholderAvatar } from './roster.js';

const VIRTUAL_TEACHER = 'Mokytoja';

export class Bots {
  constructor(host) {
    this.host = host;
    this.timer = null;
  }

  get count() { return this.host.list().filter((p) => p.bot).length; }

  fill() {
    const { roster } = this.host;
    if (!roster.kids.some((k) => k.teacher)) {
      const t = { name: VIRTUAL_TEACHER, md: '01-01', avatar: placeholderAvatar(VIRTUAL_TEACHER), teacher: true, virtual: true };
      this.host.setRoster({ ...roster, kids: [...roster.kids, t] });
    }
    const free = this.host.roster.kids.filter((k) => !this.host.playerByName(k.name));
    free.forEach((k, i) => setTimeout(() => this.host.addBot(k), i * 200));
    this.start();
  }

  start() {
    if (!this.timer) this.timer = setInterval(() => this.tick(), 300);
  }

  clear() {
    clearInterval(this.timer);
    this.timer = null;
    this.host.removeBots();
    const { roster } = this.host;
    if (roster.kids.some((k) => k.virtual)) {
      this.host.setRoster({ ...roster, kids: roster.kids.filter((k) => !k.virtual) });
    }
  }

  tick() {
    const { host } = this;
    const phase = host.phase;
    for (const p of host.list()) {
      if (!p.bot) continue;
      p.lastSeen = Date.now();
      if (phase !== 'play' && phase !== 'lobby') continue;
      if (Math.random() > (phase === 'lobby' ? 0.03 : 0.12)) continue;
      const role = host.roleOf(p.pid);
      if (!role) continue;
      const b = role.buttons[Math.floor(Math.random() * role.buttons.length)];
      host.onPress({ pid: p.pid, a: b.id });
    }
  }
}
