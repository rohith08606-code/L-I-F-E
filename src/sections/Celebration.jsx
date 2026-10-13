import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkle } from 'lucide-react';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A restrained one-shot burst of tiny hearts and sparkles from the centre. */
export default function Celebration() {
  const items = useMemo(() => {
    const rand = mulberry32(1025);
    return Array.from({ length: 22 }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const dist = 70 + rand() * 150;
      return {
        heart: i % 3 !== 0,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.7 - 50 - rand() * 60,
        size: 8 + rand() * 10,
        delay: rand() * 0.7,
        duration: 2.4 + rand() * 1.4,
        rotate: (rand() - 0.5) * 50,
      };
    });
  }, []);

  return (
    <div className="celebration" aria-hidden="true">
      {items.map((p, i) => {
        const Icon = p.heart ? Heart : Sparkle;
        return (
          <motion.span
            key={i}
            className={p.heart ? 'celebration__p celebration__p--heart' : 'celebration__p celebration__p--spark'}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.3, rotate: 0 }}
            animate={{ opacity: [0, 1, 0], x: p.x, y: p.y, scale: [0.3, 1, 0.8], rotate: p.rotate }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          >
            <Icon size={p.size} fill="currentColor" strokeWidth={0} />
          </motion.span>
        );
      })}
    </div>
  );
}
