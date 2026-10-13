import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import SentenceReveal from '../components/SentenceReveal.jsx';
import { CONTENT } from '../content.js';

export default function Final() {
  return (
    <motion.section
      id="thanks"
      className="final"
      aria-labelledby="thanks-title"
      initial={{ opacity: 0, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
    >
      <h2 id="thanks-title" className="final__title">
        <span className="final__line">{CONTENT.thanksLines[0]}</span>
        <span className="final__line final__line--second">{CONTENT.thanksLines[1]}</span>
      </h2>

      <SentenceReveal className="final__note" sentences={CONTENT.closing} stagger={0.8} />

      <footer className="final__sign">
        <Heart size={18} fill="#D8899C" color="#D8899C" aria-hidden="true" className="final__heart" />
        <p>{CONTENT.signoff}</p>
      </footer>
    </motion.section>
  );
}
