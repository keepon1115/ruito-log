'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import type { GrowthStage } from '@/lib/age';
import { buildRows, rowsToSvgInner, EYES_OPEN, EYES_CLOSED, M_SMALL, M_BIG } from '@/lib/sprite';
import { chime } from '@/lib/sound';
import { useStore } from '@/lib/store';
import type { SpriteAction, SpriteFace, SpriteMood } from '@/lib/types';

type StateName = 'idle' | 'happy' | 'cry' | 'sleep' | 'poop';

// map a user-chosen face / action to the sprite grid + pad animation class
const FACE: Record<SpriteFace, { eyes: string; mouth: string }> = {
  smile: { eyes: EYES_OPEN, mouth: M_SMALL },
  big: { eyes: EYES_OPEN, mouth: M_BIG },
  closed: { eyes: EYES_CLOSED, mouth: M_SMALL },
  neutral: { eyes: EYES_OPEN, mouth: M_SMALL },
};
const ACTION_CLASS: Record<SpriteAction, string> = {
  bob: '',
  hop: 'a-hop',
  shake: 'a-shake',
  squish: 'a-squish',
  breathe: 'a-breathe',
};

interface MoodDef {
  eyes: string;
  mouth: string;
  mood: string;
  bubble: string;
  fx: '' | 'hearts' | 'tears' | 'zzz' | 'poop';
}

const STATES: Record<StateName, MoodDef> = {
  idle: { eyes: EYES_OPEN, mouth: M_SMALL, mood: 'ごきげん', bubble: '', fx: '' },
  happy: { eyes: EYES_OPEN, mouth: M_BIG, mood: 'うれしい！', bubble: 'きゃっきゃ♪', fx: 'hearts' },
  cry: { eyes: EYES_OPEN, mouth: M_BIG, mood: 'ないてる…', bubble: 'ふぇーーん', fx: 'tears' },
  sleep: { eyes: EYES_CLOSED, mouth: M_SMALL, mood: 'おねむ', bubble: 'すやすや…', fx: 'zzz' },
  poop: { eyes: EYES_OPEN, mouth: M_SMALL, mood: 'おむつ かえて〜', bubble: 'うんち でた！', fx: 'poop' },
};

const FX: Record<string, React.JSX.Element | null> = {
  '': null,
  hearts: (
    <>
      <span className="heart" style={{ left: 24 }}>💗</span>
      <span className="heart" style={{ right: 26, animationDelay: '.4s' }}>💗</span>
      <span className="heart" style={{ left: 60, animationDelay: '.7s' }}>💕</span>
    </>
  ),
  tears: (
    <>
      <span className="tear" style={{ left: 50 }}>💧</span>
      <span className="tear" style={{ right: 52, animationDelay: '.4s' }}>💧</span>
    </>
  ),
  zzz: <span className="zzz">Z z</span>,
  poop: <span className="poo">💩</span>,
};

const POOL: StateName[] = ['happy', 'cry', 'sleep', 'poop'];

export function onMoodChange(cb?: (mood: string) => void) {
  return cb;
}

export default function Sprite({
  stage,
  onMood,
}: {
  stage: GrowthStage;
  onMood?: (mood: string) => void;
}) {
  const { spriteMoods } = useStore();
  const [name, setName] = useState<StateName>('idle');
  // override grid for transient pokes (e.g. poop→clean shows happy face) and custom moods
  const [override, setOverride] = useState<{ eyes: string; mouth: string; bubble: string; fx: MoodDef['fx']; mood: string; pad: string } | null>(null);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showCustomMood = useCallback((m: SpriteMood) => {
    const f = FACE[m.face];
    setOverride({ eyes: f.eyes, mouth: f.mouth, bubble: m.bubble, fx: m.fx, mood: m.mood, pad: ACTION_CLASS[m.action] });
    busy.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      busy.current = false;
      setOverride(null);
      setName('idle');
    }, 2600);
  }, []);

  const def = STATES[name];
  const view = override ?? { eyes: def.eyes, mouth: def.mouth, bubble: def.bubble, fx: def.fx, mood: def.mood, pad: name === 'idle' ? '' : name };

  const svg = useMemo(() => rowsToSvgInner(buildRows(stage, view.eyes, view.mouth)), [stage, view.eyes, view.mouth]);

  useEffect(() => {
    onMood?.(view.mood);
  }, [view.mood, onMood]);

  // random wandering behaviour — built-in states plus any user-authored moods
  useEffect(() => {
    const iv = setInterval(() => {
      if (busy.current || name !== 'idle' || override) return;
      if (Math.random() < 0.55) {
        // custom moods join the pool so the sprite's repertoire grows with the user's
        const pickCustom = spriteMoods.length > 0 && Math.random() < spriteMoods.length / (POOL.length + spriteMoods.length);
        if (pickCustom) {
          showCustomMood(spriteMoods[Math.floor(Math.random() * spriteMoods.length)]);
          return;
        }
        const n = POOL[Math.floor(Math.random() * POOL.length)];
        busy.current = true;
        setName(n);
        const hold = n === 'sleep' ? 4200 : n === 'poop' ? 5200 : 2600;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          if (n !== 'poop') {
            busy.current = false;
            setName('idle');
          } else {
            busy.current = false; // stays in poop until cared for
          }
        }, hold);
      }
    }, 4500);
    return () => clearInterval(iv);
  }, [name, override, spriteMoods, showCustomMood]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const poke = useCallback(() => {
    chime();
    if (name === 'poop') {
      setOverride({ eyes: EYES_OPEN, mouth: M_BIG, bubble: 'きれいに なった！', fx: 'hearts', mood: 'さっぱり♪', pad: 'happy' });
      busy.current = true;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        busy.current = false;
        setOverride(null);
        setName('idle');
      }, 1800);
      return;
    }
    busy.current = true;
    setName('happy');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      busy.current = false;
      setName('idle');
    }, 1600);
  }, [name]);

  return (
    <div className="stagewrap">
      <div
        className={`sprite-pad ${view.pad}`}
        id="pad"
        role="button"
        tabIndex={0}
        aria-label="スプライトをタップしてお世話する"
        onClick={poke}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            poke();
          }
        }}
      >
        <div className={`bubble ${view.bubble ? 'show' : ''}`}>{view.bubble}</div>
        <div className={`fx ${view.fx ? 'show' : ''}`}>{FX[view.fx]}</div>
        <svg viewBox={svg.viewBox} shapeRendering="crispEdges" dangerouslySetInnerHTML={{ __html: svg.inner }} />
      </div>
    </div>
  );
}

/** Small static sprite for profile/avatar (open eyes, small mouth). */
export function MiniSprite({ stage }: { stage: GrowthStage }) {
  const svg = useMemo(() => rowsToSvgInner(buildRows(stage, EYES_OPEN, M_SMALL)), [stage]);
  return <svg viewBox={svg.viewBox} shapeRendering="crispEdges" dangerouslySetInnerHTML={{ __html: svg.inner }} />;
}
