import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2, VolumeX, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import universe from '@/assets/astra-universe.jpg';
import { StarField } from './star-field';

export function Intro({ onClose }: { onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const video = useRef<HTMLVideoElement | null>(null);

  // Video ochilganda ijro etish. Ovoz bilan ruxsat berilmasa, ovozsiz boshlaydi.
  useEffect(() => {
    if (!playing) return;
    const v = video.current;
    if (!v) return;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      void v.play().catch(() => onClose());
    });
  }, [playing, onClose]);

  function start() {
    setPlaying(true);
  }

  function toggle() {
    setMuted((m) => !m);
  }

  return (
    <div
      className={`intro ${playing ? 'intro-playing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="ASTRA intro"
    >
      <img
        src={universe}
        alt="Koinotdagi ta’lim olami"
        className="intro-backdrop"
        width={1920}
        height={1024}
      />
      <div className="intro-shade" />
      <StarField />
      <div className="intro-dust" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      <div className="intro-top">
        <span className="eyebrow">YANGI OLAMGA XUSH KELIBSIZ</span>
        <Button variant="glass" onClick={onClose}>
          O‘tkazib yuborish <ArrowRight />
        </Button>
      </div>

      <div className="intro-center">
        <div className="intro-emblem">
          <img src="/favicon.svg" alt="" />
          <span className="intro-orbit" />
        </div>
        <h1>ASTRA</h1>
        <h2>Ta’limning yangi olami</h2>
        <p>Bilimni o‘rganing. Tajriba qiling. Kashf eting.</p>
        {!playing && (
          <Button variant="cosmic" size="lg" onClick={start}>
            <Play /> Sayohatni boshlash <Volume2 />
          </Button>
        )}
      </div>

      <div className="intro-bottom">
        <span>Bilim chegaralarni bilmaydi.</span>
        <Button
          variant="glass"
          size="icon"
          aria-label={muted ? 'Ovozni yoqish' : 'Ovozni o‘chirish'}
          onClick={toggle}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
      </div>

      {playing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000' }}>
          <video
            ref={video}
            src="/intro.mp4"
            muted={muted}
            playsInline
            onEnded={onClose}
            onError={onClose}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              display: 'flex',
              gap: 12,
            }}
          >
            <Button variant="glass" size="icon" aria-label="Ovoz" onClick={toggle}>
              {muted ? <VolumeX /> : <Volume2 />}
            </Button>
            <Button variant="glass" onClick={onClose}>
              O‘tkazib yuborish <ArrowRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
