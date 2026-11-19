// Replikų biblioteka: lines/<etapas>.json. Replikos nesikartoja,
// kol neparodytos visos tos kategorijos replikos.

import { fill, shuffle } from '../common.js';

export class Lines {
  static async load(names) {
    const data = {};
    await Promise.all(names.map(async (n) => {
      try {
        const res = await fetch(`lines/${n}.json`, { cache: 'no-store' });
        data[n] = res.ok ? await res.json() : {};
      } catch (e) {
        console.warn('[lines]', n, e);
        data[n] = {};
      }
    }));
    return new Lines(data);
  }

  constructor(data) {
    this.data = data;
    this.bags = new Map();
  }

  pick(stage, cat, vars = {}) {
    const list = this.data[stage]?.[cat] || this.data.common?.[cat];
    if (!list || !list.length) return '';
    const key = `${stage}.${cat}`;
    let bag = this.bags.get(key);
    if (!bag || !bag.length) {
      bag = shuffle(list);
      this.bags.set(key, bag);
    }
    return fill(bag.pop(), vars);
  }
}
