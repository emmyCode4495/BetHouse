import { useEffect, useRef, useState } from 'react';
import type { Market, Match } from './data';

export type OddsMap = Record<string, Record<Market, number>>;
export type Tick = { key: string; dir: 1 | -1; n: number };
const MARKETS: Market[] = ['1', 'X', '2'];

/** Demo feed: one price drifts every few seconds. Swap for your odds websocket. */
export function useLiveOdds(matches: Match[]) {
  const [odds, setOdds] = useState<OddsMap>(() =>
    Object.fromEntries(matches.map((m) => [m.id, { ...m.odds }])),
  );
  const [tick, setTick] = useState<Tick>({ key: '', dir: 1, n: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      const m = matches[Math.floor(Math.random() * matches.length)];
      const mk = MARKETS[Math.floor(Math.random() * 3)];
      const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
      const step = 0.03 + Math.random() * 0.09;
      setOdds((s) => {
        const next = Math.max(1.05, Math.round((s[m.id][mk] + dir * step) * 100) / 100);
        return { ...s, [m.id]: { ...s[m.id], [mk]: next } };
      });
      setTick((p) => ({ key: `${m.id}:${mk}`, dir, n: p.n + 1 }));
    }, 3200);
    return () => clearInterval(id);
  }, [matches]);

  return { odds, tick };
}

/** Eased count-up for money values. */
export function useTween(target: number, duration = 650) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const a = from.current;
    if (a === target) return;
    const t0 = Date.now();
    let raf = 0;
    const step = () => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      const cur = a + (target - a) * (1 - Math.pow(1 - p, 3));
      from.current = cur;
      setV(cur);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}
