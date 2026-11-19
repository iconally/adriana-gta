// Virtualūs vaikai: užpildo klasę ir spaudo mygtukus, kad žaidimą
// būtų galima matyti pilną be telefonų (kūrimui ir repeticijoms).

export class Bots {
  constructor(host) {
    this.host = host;
    this.timer = null;
  }

  get count() { return this.host.list().filter((p) => p.bot).length; }

  fill() {
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
