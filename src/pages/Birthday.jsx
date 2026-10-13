import { motion } from 'framer-motion';
import FloatingHearts from '../components/FloatingHearts.jsx';
import MusicToggle from '../components/MusicToggle.jsx';
import Hero from '../sections/Hero.jsx';
import CakeSection from '../sections/CakeSection.jsx';
import Final from '../sections/Final.jsx';

export default function Birthday() {
  return (
    <div className="page">
      <FloatingHearts />
      <MusicToggle />
      <div className="grain" aria-hidden="true" />
      <motion.main
        className="page__content"
        initial={{ opacity: 0, scale: 1.04, filter: 'blur(14px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
        transition={{ duration: 2, ease: [0.22, 0.7, 0.2, 1] }}
      >
        <Hero />
        <CakeSection />
        <Final />
      </motion.main>
    </div>
  );
}
