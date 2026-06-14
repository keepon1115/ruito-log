'use client';
import { useEffect, useRef, useState } from 'react';

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function Waveform({
  url,
  onRegion,
}: {
  url: string;
  onRegion: (start: number, end: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<any>(null);
  const regionRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [sel, setSel] = useState({ start: 0, end: 0 });

  useEffect(() => {
    let destroyed = false;
    let ws: any;

    (async () => {
      const [{ default: WaveSurfer }, { default: RegionsPlugin }] = await Promise.all([
        import('wavesurfer.js'),
        import('wavesurfer.js/dist/plugins/regions.esm.js'),
      ]);
      if (destroyed || !containerRef.current) return;

      const regions = RegionsPlugin.create();
      ws = WaveSurfer.create({
        container: containerRef.current,
        height: 56,
        waveColor: '#5BC8C4',
        progressColor: '#2BAEA9',
        cursorColor: '#E86F9E',
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        url,
        plugins: [regions],
      });
      wsRef.current = ws;

      ws.on('decode', (dur: number) => {
        setDuration(dur);
        const start = dur * 0.1;
        const end = dur * 0.9;
        const region = regions.addRegion({
          start,
          end,
          color: 'rgba(244,154,193,0.18)',
          drag: true,
          resize: true,
        });
        regionRef.current = region;
        setSel({ start, end });
        onRegion(start, end);
      });

      regions.on('region-updated', (r: any) => {
        regionRef.current = r;
        setSel({ start: r.start, end: r.end });
        onRegion(r.start, r.end);
      });

      // keep playback within the selected region
      ws.on('timeupdate', (t: number) => {
        const r = regionRef.current;
        if (r && t >= r.end) {
          ws.pause();
          ws.setTime(r.start);
          setPlaying(false);
        }
      });
      ws.on('finish', () => setPlaying(false));
    })();

    return () => {
      destroyed = true;
      try {
        ws?.destroy();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const toggle = () => {
    const ws = wsRef.current;
    const r = regionRef.current;
    if (!ws) return;
    if (playing) {
      ws.pause();
      setPlaying(false);
    } else {
      if (r) ws.setTime(r.start);
      ws.play();
      setPlaying(true);
    }
  };

  return (
    <div className="editor">
      <div ref={containerRef} style={{ margin: '4px 0 10px' }} />
      <div className="ctrls">
        <button className="pbtn" type="button" onClick={toggle} aria-label={playing ? '一時停止' : '再生'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <span className="tt">{fmt(Math.max(0, sel.end - sel.start))} / {fmt(duration)}</span>
      </div>
    </div>
  );
}
