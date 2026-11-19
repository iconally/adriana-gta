import { cityBackdrop, headText, bodyText, gradientFill, subtitle, C } from '../fx.js';
import { Tribune, loadAllAvatars } from '../tribune.js';
import { LOBBY } from '../stages.js';

// Laukiamasis: logotipas, QR kodas, prisijungusiųjų tribūna.
export class LobbyScene extends Phaser.Scene {
  constructor() { super('Lobby'); }

  create() {
    const A = window.AGTA;
    const { host, lines, sfx } = A;
    host.setPhase('lobby', LOBBY);

    cityBackdrop(this, { skylineY: 780 });
    this.add.tileSprite(960, 750, 1920, 140, 'sidewalk').setOrigin(0.5, 0).setDepth(-40);
    this.add.rectangle(960, 890 + 95, 1920, 190, 0x1d1233).setDepth(-39);
    this.drawQR(A.joinUrl);

    if (this.textures.exists('logo')) {
      const logo = this.add.image(1250, 262, 'logo').setScale(0.7);
      this.tweens.add({ targets: logo, scale: 0.73, yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.InOut' });
    } else {
      const logo = headText(this, 1250, 175, 'GTA', 230, C.yellow);
      gradientFill(logo, ['#fff07a', '#ffb03a', '#ff3ea5']);
      headText(this, 1250, 330, 'GARSIOJI TALENTINGOJI ADRIANA', 58, C.white);
    }

    this.countText = headText(this, 1250, 580, '', 76, C.yellow);
    this.infoText = bodyText(this, 1250, 660, '', 30, '#f1e6ff', { wordWrap: { width: 900 } });
    bodyText(this, 1250, 722, 'ENTER - į žemėlapį   ·   H - vedėjo pultas', 26, '#d8c4ff');

    this.tribune = new Tribune(this, host, { y: 945, maxSize: 112 });
    this.updateCount();

    const offs = [
      host.on('players', () => this.updateCount()),
      host.on('join', (p) => {
        sfx.pop();
        subtitle(this, lines.pick('common', 'join', { vardas: p.name }), { color: C.yellow, y: 840 });
      }),
      host.on('press', (e) => this.onPress(e)),
      host.on('roster', () => {
        loadAllAvatars(this, host);
        this.updateCount();
      }),
    ];
    this.events.once('shutdown', () => offs.forEach((f) => f()));

    this.input.keyboard.on('keydown-ENTER', () => A.go('Map'));
    this.time.addEvent({
      delay: 9000, loop: true,
      callback: () => subtitle(this, lines.pick('common', 'lobby'), { color: '#f1e6ff', y: 840 }),
    });
  }

  updateCount() {
    const { host } = window.AGTA;
    const { kidsTotal: total, kidsIn: n, hasTeacher, teacherIn } = host.counts();
    if (!host.roster.kids.length) {
      this.countText.setText('KLASĖ NEĮKELTA');
      this.infoText.setText('Spausk H ir įkelk klasės aplanką (arba demo klasę testui).');
      return;
    }
    this.countText.setText(`PRISIJUNGĖ: ${n} / ${total}`);
    const tip = n ? 'Telefone spausk "Labas!" - ekrane pamatysi save.' : 'Skenuok QR kodą telefonu!';
    const short = n ? 'Spausk "Labas!" telefone.' : 'Skenuok QR kodą!';
    this.infoText.setText(hasTeacher ? `${teacherIn ? 'Mokytoja irgi čia ✓' : 'Mokytoja dar neprisijungė'}  ·  ${short}` : tip);
  }

  onPress({ player, action }) {
    const { lines, sfx } = window.AGTA;
    if (action === 'labas') {
      this.tribune.bounce(player.pid);
      this.tribune.bubble(player.pid, lines.pick('common', 'labas'));
      sfx.hello();
    } else if (action === 'sokti') {
      this.tribune.wiggle(player.pid);
      this.tribune.bubble(player.pid, '♪ ♫', C.teal);
      sfx.pop();
    }
  }

  drawQR(url) {
    const size = 500;
    const x = 380;
    const y = 450;
    const card = this.add.graphics();
    card.fillStyle(0x000000, 0.35).fillRoundedRect(x - size / 2 - 22, y - size / 2 - 18, size + 56, size + 150, 34);
    card.fillStyle(0xffffff, 1).fillRoundedRect(x - size / 2 - 30, y - size / 2 - 30, size + 60, size + 140, 30);
    card.lineStyle(10, 0xff3ea5, 1).strokeRoundedRect(x - size / 2 - 30, y - size / 2 - 30, size + 60, size + 140, 30);

    if (this.textures.exists('qr')) this.textures.remove('qr');
    const qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount();
    const cell = Math.floor(size / n);
    const px = cell * n;
    const t = this.textures.createCanvas('qr', px, px);
    const ctx = t.getContext();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = '#14081f';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(c * cell, r * cell, cell, cell);
    }
    t.refresh();
    this.add.image(x, y, 'qr');
    headText(this, x, y + size / 2 + 48, 'SKENUOK IR PRISIJUNK!', 46, C.pink, { strokeThickness: 0 }).setShadow(0, 0, 'rgba(0,0,0,0)');
    const short = url.replace(/^https?:\/\//, '').replace(/&net=local$/, '');
    bodyText(this, x, y + size / 2 + 150, short, 20, '#f1e6ff', { wordWrap: { width: 640, useAdvancedWrap: true } });
    if (window.AGTA.net.mode === 'local') {
      bodyText(this, 30, 40, 'VIETINIS TESTAVIMO REŽIMAS - telefonai neprisijungs, atidaryk nuorodą kitame skirtuke (pulte H)', 22, C.orange)
        .setOrigin(0, 0.5);
    }
  }
}
