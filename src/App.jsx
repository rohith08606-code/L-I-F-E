import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Gate from './components/Gate.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { CONTENT } from './content.js';

// The birthday page lives in its own chunk and is only requested AFTER the
// correct date has been verified. Until then it is neither loaded nor mounted,
// so nothing can flash behind the black cover.
const loadBirthday = () => import('./pages/Birthday.jsx');
const Birthday = lazy(loadBirthday);

export default function App() {
  const [stage, setStage] = useState('gate'); // 'gate' | 'open'
  const preload = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('is-gated', stage === 'gate');
    if (stage === 'open') window.scrollTo(0, 0);
  }, [stage]);

  // Called the instant the date is verified: start fetching the page.
  const handleVerified = useCallback(() => {
    preload.current = loadBirthday().catch(() => null);
  }, []);

  // Called when the success animation has finished.
  const handleUnlocked = useCallback(async () => {
    if (preload.current) await preload.current;
    setStage('open');
  }, []);

  return (
    <>
      {stage === 'open' && (
        <ErrorBoundary fallback={<p className="load-error">{CONTENT.loadError}</p>}>
          <Suspense fallback={null}>
            <Birthday />
          </Suspense>
        </ErrorBoundary>
      )}
      <AnimatePresence>
        {stage === 'gate' && (
          <Gate key="gate" onVerified={handleVerified} onUnlocked={handleUnlocked} />
        )}
      </AnimatePresence>
    </>
  );
}
