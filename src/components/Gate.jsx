import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { checkDate } from '../lib/gate.js';
import { CONTENT } from '../content.js';

/** Auto-formats typing into DD.MM.YYYY. Pasting "25/10/2006" also works. */
function formatTyping(next, prev, inputType = '') {
  let digits = next.replace(/\D/g, '').slice(0, 8);
  if (inputType.startsWith('delete')) {
    const prevDigits = prev.replace(/\D/g, '');
    // Only a dot was deleted -> remove the digit before it instead.
    if (digits.length === prevDigits.length && digits.length > 0) digits = digits.slice(0, -1);
  }
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('.');
}

export default function Gate({ onVerified, onUnlocked }) {
  const reduced = useReducedMotion();
  const fieldId = useId();
  const errorId = useId();
  const shake = useAnimationControls();
  const timer = useRef(null);

  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | checking | success

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleChange = (event) => {
    setValue((prev) => formatTyping(event.target.value, prev, event.nativeEvent.inputType));
    if (error) setError(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status !== 'idle') return;
    setStatus('checking');

    const ok = await checkDate(value);

    if (ok) {
      setError(false);
      setStatus('success');
      onVerified?.();
      timer.current = setTimeout(() => onUnlocked?.(), reduced ? 700 : 2300);
      return;
    }

    setStatus('idle');
    setError(true);
    if (!reduced) {
      shake.start({
        x: [0, -11, 10, -8, 7, -3, 2, 0],
        transition: { duration: 0.55, ease: 'easeOut' },
      });
    }
  };

  const success = status === 'success';

  return (
    <motion.main
      className="gate"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        filter: 'blur(14px)',
        transition: { duration: reduced ? 0.4 : 1.8, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      <div className="gate__inner">
        <motion.div
          className="gate__halo"
          aria-hidden="true"
          animate={
            success
              ? { opacity: 1, scale: 2.6 }
              : { opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }
          }
          transition={
            success
              ? { duration: 1.8, ease: 'easeOut' }
              : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
          }
        />

        <motion.p
          className="gate__line"
          animate={{ opacity: success ? 0 : 1, y: success ? -10 : 0 }}
          transition={{ duration: 0.9 }}
          initial={{ opacity: 0, y: 12 }}
        >
          {CONTENT.gateLine}
        </motion.p>

        <motion.div
          className={`gate__heart${success ? ' is-bright' : ''}`}
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={success ? { opacity: 1, scale: [1, 1.5, 2.4] } : { opacity: 1, scale: [1, 1.1, 1] }}
          transition={
            success
              ? { duration: 1.9, ease: 'easeOut' }
              : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <Heart size={26} strokeWidth={1.6} fill="#FF5C9A" color="#FF5C9A" />
        </motion.div>

        <motion.form
          className="gate__form"
          onSubmit={handleSubmit}
          noValidate
          animate={{ opacity: success ? 0 : 1 }}
          transition={{ duration: 0.7 }}
          initial={{ opacity: 0 }}
        >
          <motion.div animate={shake} className="gate__shake">
            <div className="field" data-invalid={error}>
              <label className="sr-only" htmlFor={fieldId}>
                Date in day, month, year format
              </label>
              <input
                id={fieldId}
                className="field__input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                maxLength={10}
                placeholder="DD.MM.YYYY"
                value={value}
                onChange={handleChange}
                disabled={success}
                aria-invalid={error}
                aria-describedby={error ? errorId : undefined}
              />
              <button
                className="field__go"
                type="submit"
                aria-label="Unlock"
                disabled={status !== 'idle' || value.length < 8}
              >
                <ArrowRight size={18} strokeWidth={1.8} />
              </button>
            </div>
          </motion.div>

          <div className="gate__message" aria-live="polite">
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  id={errorId}
                  role="alert"
                  className="gate__error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {CONTENT.gateError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.form>
      </div>
      {success && <p className="sr-only" role="status">Unlocking…</p>}
    </motion.main>
  );
}
