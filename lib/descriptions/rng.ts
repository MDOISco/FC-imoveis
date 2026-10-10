// Aleatoriedade DETERMINÍSTICA: o mesmo imóvel gera sempre o mesmo texto;
// imóveis diferentes variam; "Gerar novamente" (regen) muda a semente.

export function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export type Rng = {
  next: () => number; // [0, 1)
  pick: <T>(arr: T[]) => T;
  maybe: (probability: number) => boolean;
  sampleOrdered: <T>(arr: T[], count: number) => T[];
};

export function createRng(seedText: string): Rng {
  let state = fnv1a(seedText) || 1;
  const next = () => {
    // mulberry32
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    maybe: (p) => next() < p,
    sampleOrdered: (arr, count) => {
      if (arr.length <= count) return [...arr];
      const indices = arr.map((_, i) => i);
      // embaralha e pega os primeiros, depois restaura a ordem original
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      return indices
        .slice(0, count)
        .sort((a, b) => a - b)
        .map((i) => arr[i]);
    },
  };
}
