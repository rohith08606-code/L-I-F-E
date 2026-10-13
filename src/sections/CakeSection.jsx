import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import CakeCSS from './CakeCSS.jsx';
import Celebration from './Celebration.jsx';
import { hasWebGL } from '../lib/webgl.js';
import { CONTENT } from '../content.js';

// The three.js code is only downloaded when the visitor nears the cake.
const Cake3D = lazy(() => import('./Cake3D.jsx'));

const PULSE_MS = 900; // Phase 1: flicker + glow + sparkle
const SPLIT_MS = 1350; // Phase 2: halves separate
const TEXT_DELAY_MS = 520; // Phase 3: "i love u" appears as the halves part
const CLOSE_MS = 1100;

export default function CakeSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const phaseRef = useRef('idle');
  const timers = useRef([]);

  const [phase, setPhase] = useState('idle'); // idle | pulse | split | open | closing
  const [textVisible, setTextVisible] = useState(false);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [use3D, setUse3D] = useState(() => hasWebGL());

  const go = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const later = useCallback((fn, ms) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Lazy-load 3D when near the viewport; pause rendering when off-screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      setVisible(true);
      return undefined;
    }
    const nearObs = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), {
      rootMargin: '700px 0px',
    });
    const visObs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: '120px 0px',
    });
    nearObs.observe(el);
    visObs.observe(el);
    return () => {
      nearObs.disconnect();
      visObs.disconnect();
    };
  }, []);

  const open = useCallback(() => {
    if (phaseRef.current !== 'idle') return;
    clearTimers();
    const pulse = reduced ? 150 : PULSE_MS;
    go('pulse');
    later(() => go('split'), pulse);
    later(() => setTextVisible(true), pulse + (reduced ? 150 : TEXT_DELAY_MS));
    later(() => go('open'), pulse + (reduced ? 450 : SPLIT_MS));
  }, [clearTimers, go, later, reduced]);

  const replay = useCallback(() => {
    if (phaseRef.current !== 'open') return;
    clearTimers();
    setTextVisible(false);
    go('closing');
    later(() => go('idle'), reduced ? 450 : CLOSE_MS);
  }, [clearTimers, go, later, reduced]);

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };

  const scrollTo = (id) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });

  const isOpen = phase === 'open';
  const interactive = phase === 'idle';

  return (
    <motion.section
      id="cake"
      ref={sectionRef}
      className="cake"
      aria-labelledby="cake-title"
      initial={{ opacity: 0, scale: 0.985 }}
      whileInView={{ opacity: 1, scale: 1, transitionEnd: { transform: 'none' } }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      <div
        ref={stageRef}
        className={`cake-stage${interactive ? ' is-ready' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={CONTENT.cakeLabel}
        aria-disabled={!interactive}
        onClick={open}
        onKeyDown={onKeyDown}
      >
        <div className={`cake-stage__glow${phase === 'pulse' ? ' is-on' : ''}`} aria-hidden="true" />

        {use3D ? (
          <ErrorBoundary
            fallback={<CakeCSS phase={phase} />}
            onError={() => setUse3D(false)}
          >
            <Suspense fallback={<div className="cake-stage__loading"><Heart size={22} fill="currentColor" strokeWidth={0} /></div>}>
              {near && <Cake3D phase={phase} reduced={!!reduced} active={visible} />}
            </Suspense>
          </ErrorBoundary>
        ) : (
          <CakeCSS phase={phase} />
        )}

        {phase === 'pulse' && (
          <div className="cake-pulse" aria-hidden="true">
            <span className="cake-pulse__ring" />
            <span className="cake-pulse__ring cake-pulse__ring--late" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <span key={deg} className="cake-pulse__spark" style={{ '--a': `${deg}deg` }} />
            ))}
          </div>
        )}

        <div className="cake-message" aria-live="polite">
          <AnimatePresence>
            {textVisible && (
              <motion.p
                key="center-text"
                className="cake-message__text"
                initial={{ opacity: 0, scale: 0.8, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.35 } }}
                transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {CONTENT.centerText}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {isOpen && !reduced && <Celebration key="celebration" />}
      </div>

      <h2 id="cake-title" className="cake__title">
        {CONTENT.cakeTitle}
      </h2>

      <div className="cake__controls">
        <p className={`cake__hint${interactive ? '' : ' is-hidden'}`} aria-hidden={!interactive}>
          {CONTENT.cakeHint}
        </p>
        <div className={`cake__after${isOpen ? ' is-shown' : ''}`}>
          <button type="button" className="btn-soft" onClick={replay} tabIndex={isOpen ? 0 : -1}>
            {CONTENT.replay}
          </button>
          <button
            type="button"
            className="btn-text"
            onClick={() => scrollTo('thanks')}
            tabIndex={isOpen ? 0 : -1}
          >
            {CONTENT.oneMoreThing}
          </button>
        </div>
      </div>
    </motion.section>
  );
}
