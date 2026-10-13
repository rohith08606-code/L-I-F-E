import { motion, useReducedMotion } from 'framer-motion';
import { Sparkle } from 'lucide-react';
import SentenceReveal from '../components/SentenceReveal.jsx';
import { CONTENT } from '../content.js';

export default function Hero() {
  const reduced = useReducedMotion();

  const rise = (delay) => ({
    initial: { opacity: 0, y: reduced ? 0 : 22, filter: 'blur(10px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 1.5, delay, ease: [0.22, 0.7, 0.2, 1] },
  });

  const scrollToCake = () => {
    document
      .getElementById('cake')
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <motion.h1 id="hero-title" className="hero__title" {...rise(1.1)}>
        <span className="hero__greeting">{CONTENT.greeting}</span>{' '}
        <span className="hero__name">{CONTENT.name}</span>{' '}
        <span className="hero__heart">♡</span>
      </motion.h1>

      <motion.p className="hero__label" {...rise(2.0)}>
        {CONTENT.quoteLabel}
      </motion.p>

      <motion.figure className="quote" {...rise(2.6)}>
        <Sparkle className="quote__star quote__star--a" size={16} fill="currentColor" strokeWidth={0} aria-hidden="true" />
        <Sparkle className="quote__star quote__star--b" size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
        <blockquote className="quote__text">{CONTENT.quote}</blockquote>
      </motion.figure>

      <SentenceReveal className="hero__message" sentences={CONTENT.message} />

      <button type="button" className="btn-soft" onClick={scrollToCake}>
        {CONTENT.surpriseButton}
      </button>
    </section>
  );
}
