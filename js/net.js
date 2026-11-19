// Ryšys tarp ekrano ir telefonų.
//
// Du režimai:
//  - "supabase": tikras žaidimas. Ekranas siunčia žinutes kanalu "agta-KODAS"
//    (jį klauso visi telefonai), o telefonai siunčia į "agta-KODAS-up"
//    per REST (httpSend). Taip telefonai negauna vieni kitų paspaudimų,
//    ir Supabase žinučių kiekis lieka mažas.
//  - "local": testavimui be interneto. BroadcastChannel tarp tos pačios
//    naršyklės skirtukų.
//
// Sąsaja abiem režimams vienoda:
//   net.send(tipas, duomenys)   net.on(tipas, fn)   net.onStatus(fn)

import { EventBus } from './common.js';

export async function connectNet({ side, room, mode = 'auto' }) {
  const cfg = window.AGTA_CONFIG || {};
  const canSupabase = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
  if (mode !== 'local' && canSupabase) return supabaseNet({ side, room, cfg });
  return localNet({ side, room });
}

class BaseNet extends EventBus {
  constructor(mode) {
    super();
    this.mode = mode;
    this.status = 'connecting';
  }
  setStatus(s) {
    if (this.status === s) return;
    this.status = s;
    this.emit('__status', s);
  }
  onStatus(fn) { fn(this.status); return this.on('__status', fn); }
  dispatch(msg) {
    if (!msg || typeof msg.t !== 'string') return;
    this.emit(msg.t, msg.d || {});
  }
}

function localNet({ side, room }) {
  const net = new BaseNet('local');
  const ch = new BroadcastChannel(`agta-${room}`);
  const me = side === 'screen' ? 'screen' : 'phones';
  const other = side === 'screen' ? 'phones' : 'screen';
  ch.onmessage = (ev) => {
    if (ev.data?.to === me) net.dispatch(ev.data);
  };
  net.send = (t, d = {}) => ch.postMessage({ to: other, t, d });
  net.close = () => ch.close();
  setTimeout(() => net.setStatus('online'), 0);
  return net;
}

function supabaseNet({ side, room, cfg }) {
  const net = new BaseNet('supabase');
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const downName = `agta-${room}`;
  const upName = `agta-${room}-up`;
  const opts = { config: { broadcast: { self: false, ack: false } } };

  const watch = (status) => {
    if (status === 'SUBSCRIBED') net.setStatus('online');
    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') net.setStatus('offline');
  };

  if (side === 'screen') {
    const down = client.channel(downName, opts);
    const up = client.channel(upName, opts);
    up.on('broadcast', { event: 'm' }, ({ payload }) => net.dispatch(payload));
    up.subscribe(watch);
    down.subscribe();
    net.send = (t, d = {}) => {
      down.send({ type: 'broadcast', event: 'm', payload: { t, d } }).catch((e) => console.warn('[net] send', e));
    };
  } else {
    const down = client.channel(downName, opts);
    down.on('broadcast', { event: 'm' }, ({ payload }) => net.dispatch(payload));
    down.subscribe(watch);
    // Telefonas į "up" kanalą neprisijungia - siunčia per REST.
    let up = client.channel(upName, opts);
    let wsFallback = false;
    net.send = (t, d = {}) => {
      const payload = { t, d };
      if (wsFallback) {
        up.send({ type: 'broadcast', event: 'm', payload });
        return;
      }
      up.httpSend('m', payload).catch((err) => {
        console.warn('[net] httpSend nepavyko, jungiamės per websocket', err);
        wsFallback = true;
        up.subscribe((s) => {
          if (s === 'SUBSCRIBED') up.send({ type: 'broadcast', event: 'm', payload });
        });
      });
    };
  }
  net.close = () => client.removeAllChannels();
  return net;
}
