'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { ageInDays, growthStage, formatBirthday, STAGE_LABEL } from '@/lib/age';
import type { SpriteAction, SpriteFace, SpriteFx } from '@/lib/types';
import { MiniSprite } from './Sprite';

const FACE_OPTIONS: Array<{ v: SpriteFace; l: string }> = [
  { v: 'smile', l: 'にっこり' },
  { v: 'big', l: 'おおわらい' },
  { v: 'closed', l: 'めをとじる' },
  { v: 'neutral', l: 'すまし' },
];
const ACTION_OPTIONS: Array<{ v: SpriteAction; l: string }> = [
  { v: 'bob', l: 'ぷかぷか' },
  { v: 'hop', l: 'ぴょんぴょん' },
  { v: 'shake', l: 'ぷるぷる' },
  { v: 'squish', l: 'ぺこっ' },
  { v: 'breathe', l: 'すーすー' },
];
const FX_OPTIONS: Array<{ v: SpriteFx; l: string }> = [
  { v: '', l: 'なし' },
  { v: 'hearts', l: 'ハート' },
  { v: 'tears', l: 'なみだ' },
  { v: 'zzz', l: 'Zzz' },
  { v: 'poop', l: 'うんち' },
];

function moodEmoji(face: SpriteFace, fx: SpriteFx): string {
  if (fx === 'hearts') return '💕';
  if (fx === 'tears') return '💧';
  if (fx === 'zzz') return '😴';
  if (fx === 'poop') return '💩';
  if (face === 'big') return '😆';
  if (face === 'closed') return '😌';
  return '🙂';
}

export default function ProfileScreen({ active }: { active: boolean }) {
  const { child, updateProfile, spriteMoods, addSpriteMood, removeSpriteMood } = useStore();
  const [bubble, setBubble] = useState('');
  const [moodCaption, setMoodCaption] = useState('');
  const [face, setFace] = useState<SpriteFace>('smile');
  const [action, setAction] = useState<SpriteAction>('hop');
  const [fx, setFx] = useState<SpriteFx>('hearts');
  const [name, setName] = useState(child.name);
  const [birthday, setBirthday] = useState(child.birthday);
  const [height, setHeight] = useState(String(child.height_cm));
  const [weight, setWeight] = useState(String(child.weight_kg));
  const [saved, setSaved] = useState(false);

  // keep local fields in sync if store changes elsewhere
  useEffect(() => {
    setName(child.name);
    setBirthday(child.birthday);
    setHeight(String(child.height_cm));
    setWeight(String(child.weight_kg));
  }, [child]);

  const days = ageInDays(birthday);
  const stage = growthStage(birthday);

  const save = () => {
    updateProfile({
      name: name.trim() || child.name,
      birthday,
      height_cm: parseFloat(height) || child.height_cm,
      weight_kg: parseFloat(weight) || child.weight_kg,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  const canAddMood = bubble.trim() !== '';
  const addMood = () => {
    if (!canAddMood) return;
    addSpriteMood({
      emoji: moodEmoji(face, fx),
      bubble: bubble.trim(),
      mood: moodCaption.trim() || bubble.trim(),
      face,
      action,
      fx,
    });
    setBubble('');
    setMoodCaption('');
  };

  const faceLabel = (v: SpriteFace) => FACE_OPTIONS.find((o) => o.v === v)?.l ?? v;
  const actionLabel = (v: SpriteAction) => ACTION_OPTIONS.find((o) => o.v === v)?.l ?? v;

  return (
    <section className={`screen ${active ? 'active' : ''}`} id="s-prof" aria-hidden={!active}>
      <div className="eyebrow">profile</div>
      <h2 className="title">プロフィール編集</h2>

      <div className="avatar-pick">
        <div className="mini"><MiniSprite stage={stage} /></div>
        <div className="txt">
          <div className="a">いまのスプライト ・ {STAGE_LABEL[stage]}</div>
          <div className="b">月齢で見た目が育っていきます</div>
        </div>
      </div>

      <div className="sprite-lab">
        <div className="lab-h">スプライトのバリエーション</div>
        <div className="lab-d">言葉・表情・動作をふやすと、ホームのスプライトがときどき見せてくれます</div>

        <div className="mood-list">
          {spriteMoods.length === 0 ? (
            <div className="empty-sm">まだありません。下から追加してみましょう</div>
          ) : (
            spriteMoods.map((m) => (
              <div className="mood-item" key={m.id}>
                <span className="mi-emo">{m.emoji}</span>
                <div className="mi-txt">
                  <div className="mi-bubble">「{m.bubble}」</div>
                  <div className="mi-meta">{faceLabel(m.face)} ・ {actionLabel(m.action)}</div>
                </div>
                <button className="mi-del" type="button" aria-label="削除" onClick={() => removeSpriteMood(m.id)}>×</button>
              </div>
            ))
          )}
        </div>

        <div className="mood-form">
          <input
            className="textinp"
            placeholder="言葉（例：あそぼ！）"
            value={bubble}
            onChange={(e) => setBubble(e.target.value)}
            maxLength={20}
          />
          <input
            className="textinp"
            placeholder="きもち（任意・例：ごきげん）"
            value={moodCaption}
            onChange={(e) => setMoodCaption(e.target.value)}
            maxLength={16}
          />
          <div className="row">
            <select value={face} onChange={(e) => setFace(e.target.value as SpriteFace)} aria-label="表情">
              {FACE_OPTIONS.map((o) => <option key={o.v} value={o.v}>表情：{o.l}</option>)}
            </select>
            <select value={action} onChange={(e) => setAction(e.target.value as SpriteAction)} aria-label="動作">
              {ACTION_OPTIONS.map((o) => <option key={o.v} value={o.v}>動作：{o.l}</option>)}
            </select>
          </div>
          <select value={fx} onChange={(e) => setFx(e.target.value as SpriteFx)} aria-label="エフェクト">
            {FX_OPTIONS.map((o) => <option key={o.v} value={o.v}>エフェクト：{o.l}</option>)}
          </select>
          <button className="add-mood" type="button" onClick={addMood} disabled={!canAddMood}>＋ ふやす</button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="pf-name">なまえ</label>
        <input id="pf-name" className="inp" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="pf-bd">うまれた日</label>
        <input id="pf-bd" className="inp" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        <div className="b" style={{ fontSize: 11, color: 'var(--ink-soft)', margin: '6px 0 0 4px' }}>
          {formatBirthday(birthday)} ・ 生後{days}日
        </div>
      </div>

      <div className="field">
        <label htmlFor="pf-h">しんちょう</label>
        <input id="pf-h" className="inp" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="pf-w">たいじゅう</label>
        <input id="pf-w" className="inp" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>

      <button className="save-btn" type="button" onClick={save}>{saved ? 'ほぞんしました ♡' : '保存する'}</button>
    </section>
  );
}
