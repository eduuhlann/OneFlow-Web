import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, MessageCircle, Pause, Play, Plus, UserRoundPlus, Users } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import './discipleship-welcome.css';

export type DiscipleshipWelcomeProps = {
  displayName?: string;
  connectionCount?: number;
  onExplorePeople: () => void;
  onConversations: () => void;
  onNewGroup: () => void;
  onExplorePlans: () => void;
  onBack: () => void;
};

function ellipsePath(radiusX: number, radiusY: number, rotation: number) {
  const radians = (rotation / 180) * Math.PI;
  return Array.from({ length: 121 }, (_, index) => {
    const angle = (index / 120) * Math.PI * 2;
    const x = radiusX * Math.cos(angle);
    const y = radiusY * Math.sin(angle);
    const rotatedX = x * Math.cos(radians) - y * Math.sin(radians);
    const rotatedY = x * Math.sin(radians) + y * Math.cos(radians);
    return `${index ? 'L' : 'M'}${rotatedX.toFixed(2)},${rotatedY.toFixed(2)}`;
  }).join(' ') + ' Z';
}

const firstOrbit = ellipsePath(159, 75, 32);
const secondOrbit = ellipsePath(141, 91, -39);

export function DiscipleshipWelcome({
  displayName,
  connectionCount,
  onExplorePeople,
  onConversations,
  onNewGroup,
  onExplorePlans,
  onBack,
}: DiscipleshipWelcomeProps) {
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const still = paused || Boolean(reducedMotion);
  const svgRef = useRef<SVGSVGElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const initial = displayName?.trim().charAt(0).toLocaleUpperCase('pt-BR') || 'V';
  const count = typeof connectionCount === 'number' && Number.isFinite(connectionCount)
    ? Math.max(0, Math.floor(connectionCount))
    : 0;
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 70, damping: 22, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 70, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (still) svgRef.current?.pauseAnimations();
    else svgRef.current?.unpauseAnimations();
  }, [still]);

  useEffect(() => {
    const art = artRef.current;
    const reset = () => {
      pointerX.set(0);
      pointerY.set(0);
    };
    if (!art || still) {
      reset();
      return;
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const bounds = art.getBoundingClientRect();
      pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 12);
      pointerY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 9);
    };
    art.addEventListener('pointermove', move);
    art.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    return () => {
      art.removeEventListener('pointermove', move);
      art.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
    };
  }, [still, pointerX, pointerY]);

  return (
    <section className="disc-welcome" data-paused={still ? 'true' : 'false'} aria-labelledby={`${id}-title`}>
      <div className="disc-welcome-shell">
        <header className="disc-welcome-topbar">
          <button type="button" className="disc-welcome-back" onClick={onBack} aria-label="Voltar ao início">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar ao início</span>
          </button>
          <span className="disc-welcome-eyebrow">DISCIPULADO</span>
          <button
            type="button"
            className="disc-welcome-motion"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={still}
            aria-label={reducedMotion ? 'Animações reduzidas pela preferência do dispositivo' : paused ? 'Retomar animações' : 'Pausar animações'}
            title={reducedMotion ? 'Sua preferência de movimento reduzido está ativa' : paused ? 'Retomar animações' : 'Pausar animações'}
            disabled={Boolean(reducedMotion)}
          >
            {paused && !reducedMotion ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
            <span>{reducedMotion ? 'Movimento reduzido' : paused ? 'Retomar' : 'Pausar animações'}</span>
          </button>
        </header>

        <article className="disc-welcome-paper">
          <div className="disc-welcome-paper-top">
            <span><Users size={15} strokeWidth={1.5} aria-hidden="true" /> Conexões com propósito</span>
            <span className="disc-welcome-meta">
              {count > 0 ? `${count} ${count === 1 ? 'CONEXÃO' : 'CONEXÕES'}` : 'UMA CAMINHADA COMPARTILHADA'}
            </span>
          </div>

          <div className="disc-welcome-main">
            <div className="disc-welcome-intro">
              <span className="disc-welcome-kicker">A FÉ TAMBÉM SE VIVE EM COMPANHIA.</span>
              <h1 id={`${id}-title`}>Bem-vindo(a) ao <em>Discipulado.</em></h1>
              <p className="disc-welcome-description">Sua fé cresce quando a caminhada é compartilhada.</p>

              <div className="disc-welcome-actions">
                <button type="button" className="disc-welcome-primary" onClick={onExplorePeople}>
                  <UserRoundPlus size={17} strokeWidth={1.6} aria-hidden="true" />
                  <span>Encontrar pessoas</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
                <button type="button" className="disc-welcome-secondary" onClick={onConversations}>
                  <MessageCircle size={17} strokeWidth={1.6} aria-hidden="true" />
                  <span>Minhas conversas</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
                <div className="disc-welcome-more-actions">
                  <button type="button" onClick={onNewGroup}>
                    <Plus size={15} aria-hidden="true" /> Criar grupo
                  </button>
                  <button type="button" onClick={onExplorePlans}>
                    <BookOpen size={15} strokeWidth={1.6} aria-hidden="true" /> Explorar planos
                  </button>
                </div>
              </div>
            </div>

            <div className="disc-welcome-visual">
              <div className="disc-welcome-art" ref={artRef} aria-hidden="true">
                <motion.div className="disc-welcome-art-plane" style={{ x: smoothX, y: smoothY }}>
                  <svg ref={svgRef} viewBox="0 0 440 310" fill="none" className="disc-welcome-orbit-svg">
                    <defs>
                      <path id={`${id}-orbit-one`} d={firstOrbit} />
                      <path id={`${id}-orbit-two`} d={secondOrbit} />
                    </defs>
                    <g transform="translate(220 151)">
                      <ellipse className="disc-welcome-orbit-one" rx="159" ry="75" transform="rotate(32)" stroke="#a5a59b" strokeWidth="0.8" strokeOpacity="0.62" />
                      <ellipse className="disc-welcome-orbit-two" rx="141" ry="91" transform="rotate(-39)" stroke="#a5a59b" strokeWidth="0.8" strokeOpacity="0.62" />
                      <circle r="44" fill="#d3d2ca" />
                      <Users x={-20} y={-20} width={40} height={40} stroke="#262721" strokeWidth={1} />

                      <g transform={reducedMotion ? 'translate(-108 -61)' : undefined}>
                        {!reducedMotion && <animateMotion dur="32s" begin="-16s" repeatCount="indefinite"><mpath href={`#${id}-orbit-one`} /></animateMotion>}
                        <circle r="24" fill="#b7b7aa" />
                        <text fill="#24251f" textAnchor="middle" dominantBaseline="central" fontFamily="Outfit, sans-serif" fontSize="18" fontWeight="400">{initial}</text>
                      </g>
                      <g transform={reducedMotion ? 'translate(123 66)' : undefined}>
                        {!reducedMotion && <animateMotion dur="38s" begin="-4s" repeatCount="indefinite"><mpath href={`#${id}-orbit-two`} /></animateMotion>}
                        <circle r="24" fill="#30322b" />
                        <text fill="#f4f3ee" textAnchor="middle" dominantBaseline="central" fontFamily="Outfit, sans-serif" fontSize="18" fontWeight="400">C</text>
                      </g>
                      <g transform={reducedMotion ? 'translate(32 -103)' : undefined}>
                        {!reducedMotion && <animateMotion dur="27s" begin="-20s" repeatCount="indefinite"><mpath href={`#${id}-orbit-two`} /></animateMotion>}
                        <circle r="3" fill="#99998c" />
                      </g>
                    </g>
                    <g transform="translate(342 65)">
                      <g className="disc-welcome-star" stroke="#43453a" strokeWidth="1.25" strokeLinecap="round">
                        <path d="M-12 0H12M0-12V12M-8.5-8.5L8.5 8.5M-8.5 8.5L8.5-8.5" />
                      </g>
                    </g>
                    <g stroke="#959589" strokeWidth="0.7" opacity="0.5">
                      <path d="M63 239h6m-3-3v6M385 144h6m-3-3v6" />
                    </g>
                  </svg>
                </motion.div>
                <span className="disc-welcome-orbit-caption">VOCÊ · COMUNIDADE · PROPÓSITO</span>
              </div>

              <aside className="disc-welcome-mantra">
                <MessageCircle size={19} strokeWidth={1.3} aria-hidden="true" />
                <p>Uma conversa pode ser o começo de uma nova jornada.</p>
              </aside>
              <div className="disc-welcome-visual-note">
                <span>Pequenos encontros. Novos caminhos.</span>
                <ArrowUpRight size={15} strokeWidth={1.4} aria-hidden="true" />
              </div>
            </div>
          </div>

          <footer className="disc-welcome-paper-bottom">
            <span>Fé que aproxima. Laços que permanecem.</span>
            <span className="disc-welcome-bottom-symbol" aria-hidden="true">✳</span>
          </footer>
        </article>
        <p className="disc-welcome-bottom-note">Cada jornada tem seu ritmo. Encontre alguém para caminhar com você.</p>
      </div>
    </section>
  );
}

export default DiscipleshipWelcome;
