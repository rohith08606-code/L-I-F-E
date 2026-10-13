import { Fragment } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Reveals a paragraph one sentence at a time once it scrolls into view.
 * The sentences are joined with plain spaces, so the paragraph reads exactly
 * as written.
 */
export default function SentenceReveal({ sentences, className = '', stagger = 0.9 }) {
  const reduced = useReducedMotion();

  const parent = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : stagger, delayChildren: 0.1 } },
  };
  const child = {
    hidden: { opacity: 0, filter: 'blur(6px)' },
    show: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: { duration: reduced ? 0 : 1.1, ease: 'easeOut' },
    },
  };

  return (
    <motion.p
      className={className}
      variants={parent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 'some', margin: '0px 0px -12% 0px' }}
    >
      {sentences.map((sentence, i) => (
        <Fragment key={i}>
          <motion.span variants={child}>{sentence}</motion.span>
          {i < sentences.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </motion.p>
  );
}
