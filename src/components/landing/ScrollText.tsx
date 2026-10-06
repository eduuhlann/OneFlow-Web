import { useMemo, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import './scroll-text.css';

type ScrollTextProps = {
  children: string;
  mode?: 'words' | 'letters';
  className?: string;
  disabled?: boolean;
  initialVisible?: boolean;
  start?: number;
  end?: number;
};

const graphemeSegmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl
  ? new Intl.Segmenter('pt-BR', { granularity: 'grapheme' })
  : null;

function lettersOf(word: string) {
  return graphemeSegmenter
    ? Array.from(graphemeSegmenter.segment(word), ({ segment }) => segment)
    : Array.from(word.normalize('NFC'));
}

function ScrollToken({ children, progress, index, total, mode }: {
  children: string;
  progress: MotionValue<number>;
  index: number;
  total: number;
  mode: 'words' | 'letters';
}) {
  const revealLength = mode === 'letters' ? 0.32 : 0.42;
  const start = total > 1 ? (index / (total - 1)) * (1 - revealLength) : 0;
  const end = start + revealLength;
  const opacity = useTransform(progress, [start, end], [0.2, 1]);
  const y = useTransform(progress, [start, end], [18, 0]);
  const filter = useTransform(progress, [start, end], ['blur(3px)', 'blur(0px)']);

  return <motion.span className="landing-scroll-text-token" style={{ opacity, y, filter }}>{children}</motion.span>;
}

/** Reveals text in reading order, directly linked to its position in the viewport. */
export default function ScrollText({ children, mode = 'words', className = '', disabled = false, initialVisible = false, start = 0.94, end = 0.5 }: ScrollTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: [`start ${start}`, `start ${end}`] });
  const staticText = disabled || prefersReducedMotion || initialVisible;
  const pieces = useMemo(() => children.split(/(\s+)/u).filter(Boolean).map((piece) => ({
    text: piece,
    whitespace: /^\s+$/u.test(piece),
    letters: lettersOf(piece),
  })), [children]);
  const total = pieces.reduce((count, piece) => count + (piece.whitespace ? 0 : mode === 'letters' ? piece.letters.length : 1), 0);
  let tokenIndex = 0;

  return <span ref={ref} className={`landing-scroll-text ${className}`.trim()}>
    <span className="landing-scroll-text-accessible">{children}</span>
    <span className="landing-scroll-text-visual" aria-hidden="true">
      {staticText ? children : pieces.map((piece, pieceIndex) => {
        if (piece.whitespace) return piece.text;
        if (mode === 'words') return <ScrollToken key={pieceIndex} progress={scrollYProgress} index={tokenIndex++} total={total} mode={mode}>{piece.text}</ScrollToken>;
        return <span className="landing-scroll-text-word" key={pieceIndex}>
          {piece.letters.map((letter, letterIndex) => <ScrollToken key={letterIndex} progress={scrollYProgress} index={tokenIndex++} total={total} mode={mode}>{letter}</ScrollToken>)}
        </span>;
      })}
    </span>
  </span>;
}
