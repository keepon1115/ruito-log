// Age & growth-stage helpers derived from a birthday.

export type GrowthStage = 'newborn' | 'kubisuwari' | 'osuwari' | 'tsukamari' | 'ayumi';

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.4375;

/** Whole days lived since birthday (>= 0). */
export function ageInDays(birthday: string, now: Date = new Date()): number {
  const b = new Date(birthday + 'T00:00:00');
  const d = Math.floor((now.getTime() - b.getTime()) / MS_PER_DAY);
  return Math.max(0, d);
}

/** Months lived (fractional). */
export function ageInMonths(birthday: string, now: Date = new Date()): number {
  return ageInDays(birthday, now) / DAYS_PER_MONTH;
}

/** Month-age bracket → sprite growth stage. */
export function growthStage(birthday: string, now: Date = new Date()): GrowthStage {
  const m = ageInMonths(birthday, now);
  if (m < 1.5) return 'newborn';
  if (m < 4) return 'kubisuwari';
  if (m < 8) return 'osuwari';
  if (m < 11) return 'tsukamari';
  return 'ayumi';
}

export const STAGE_LABEL: Record<GrowthStage, string> = {
  newborn: '新生児',
  kubisuwari: '首すわり',
  osuwari: 'おすわり',
  tsukamari: 'つかまり立ち',
  ayumi: 'あんよ',
};

/** "2025年12月9日" */
export function formatBirthday(birthday: string): string {
  const b = new Date(birthday + 'T00:00:00');
  return `${b.getFullYear()}年${b.getMonth() + 1}月${b.getDate()}日`;
}

/** "2026.06.07" for dot-font date labels. */
export function formatDotDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
