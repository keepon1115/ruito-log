'use client';
import { useState } from 'react';
import { StoreProvider } from '@/lib/store';
import HomeScreen from './HomeScreen';
import PostScreen from './PostScreen';
import JitenScreen from './JitenScreen';
import ProfileScreen from './ProfileScreen';

type ScreenId = 's-top' | 's-post' | 's-jiten' | 's-prof';

const NAV: Array<{ id: ScreenId; icon: string; label: string }> = [
  { id: 's-top', icon: '🏠', label: 'ホーム' },
  { id: 's-post', icon: '🎙️', label: 'のこす' },
  { id: 's-jiten', icon: '📖', label: 'じてん' },
  { id: 's-prof', icon: '🐤', label: 'プロフ' },
];

export default function PhoneShell() {
  const [screen, setScreen] = useState<ScreenId>('s-top');

  return (
    <StoreProvider>
      <div className="stage">
        <div className="phone">
          <div className="notch" />
          <div className="screens">
            <HomeScreen active={screen === 's-top'} />
            <PostScreen active={screen === 's-post'} />
            <JitenScreen active={screen === 's-jiten'} />
            <ProfileScreen active={screen === 's-prof'} />
          </div>
          <nav className="nav">
            {NAV.map((n) => (
              <button key={n.id} className={screen === n.id ? 'on' : ''} onClick={() => setScreen(n.id)} aria-current={screen === n.id}>
                <span className="gi">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="caption">るいとの成長日記 ・ スプライトをタップ／放っておくと勝手に動きます</div>
      </div>
    </StoreProvider>
  );
}
