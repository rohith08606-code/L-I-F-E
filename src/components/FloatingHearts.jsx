import { useMemo } from 'react';
import { Heart } from 'lucide-react';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A handful of slow rose hearts and tiny twinkling lights. Purely decorative. */
export default function FloatingHearts() {
  const { hearts, dots } = useMemo(() => {
    const rand = mulberry32(2610);
    return {
      hearts: Array.from({ length: 9 }, (_, i) => ({
        left: 6 + ((i * 11 + rand() * 6) % 88),
        size: 12 + rand() * 14,
        duration: 26 + rand() * 18,
        delay: -rand() * 40,
        drift: (rand() - 0.5) * 80,
        opacity: 0.16 + rand() * 0.2,
      })),
      dots: Array.from({ length: 12 }, () => ({
        left: rand() * 100,
        top: rand() * 100,
        size: 2 + rand() * 3,
        duration: 4 + rand() * 5,
        delay: -rand() * 8,
      })),
    };
  }, []);

  return (
    <div className="fx" aria-hidden="true">
      {dots.map((d, i) => (
        <span
          key={`d${i}`}
          className="fx__dot"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
      {hearts.map((h, i) => (
        <Heart
          key={`h${i}`}
          className="fx__heart"
          size={h.size}
          fill="currentColor"
          strokeWidth={0}
          style={{
            left: `${h.left}%`,
            '--o': h.opacity,
            '--dx': `${h.drift}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
