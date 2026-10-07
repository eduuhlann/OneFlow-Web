import { BookOpen, ArrowUpRight, Check, Sparkles } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import './flow-artwork.css';

type FlowArtworkProps = { paused?: boolean };

export default function FlowArtwork({ paused = false }: FlowArtworkProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="flow-art" data-still={paused || reducedMotion ? 'true' : 'false'}>
      <div className="flow-art-glow" aria-hidden="true" />
      <div className="flow-reading-card">
        <div className="flow-reading-header">
          <span><BookOpen size={16} /> UM MOMENTO COM DEUS</span>
          <span className="flow-reading-edition">NVI</span>
        </div>
        <div className="flow-reading-body">
          <span className="flow-reading-reference">SALMOS 119:105</span>
          <blockquote>“A tua palavra é a lâmpada para os meus pés, e a luz para o meu caminho.”</blockquote>
          <div className="flow-reading-divider" />
          <p>Respire. Leia com calma.<br />Deixe a Palavra iluminar seu dia.</p>
        </div>
        <div className="flow-reading-footer">
          <span><span className="flow-reading-dot" /> SUA PAUSA DIÁRIA</span>
          <ArrowUpRight size={19} aria-hidden="true" />
        </div>
      </div>
      <div className="flow-reading-progress">
        <span className="flow-reading-progress-icon"><Sparkles size={18} /></span>
        <div><strong>Um dia de cada vez.</strong><span>Pequenos passos. Uma nova perspectiva.</span></div>
        <span className="flow-reading-check"><Check size={16} /></span>
      </div>
    </div>
  );
}
