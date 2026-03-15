import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mountain, Sparkles, Lock, CheckCircle2, Star, Flame, Crown } from 'lucide-react';
import { statsService } from '../services/features/statsService';
import { STATIC_BOOKS } from '../services/bible/staticBibleData';
import PageTransition from '../components/PageTransition';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/* ─── constants ─────────────────────────────────────────── */
const POSITIONS   = [0.5, 0.22, 0.78, 0.38, 0.18, 0.82];
const NODE_HEIGHT = 168;
const COL_W       = 380;
const NODE_R      = 34;

// Milestone book names that get larger / special treatment
const MILESTONE_BOOKS = new Set(['gn','sl','is','mt','jo','ap','rm']);

/* ─── seeded random ──────────────────────────────────────── */
function seededRand(seed: number) {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
}

/* ─── types ──────────────────────────────────────────────── */
interface PathNode {
    id: string; name: string; abbrevPt: string;
    isCompleted: boolean; isUnlocked: boolean; isCurrent: boolean;
    isMilestone: boolean;
    index: number; x: number;
}

/* ─── SVG cubic path ─────────────────────────────────────── */
function buildPath(nodes: PathNode[]): string {
    if (nodes.length < 2) return '';
    const pts = nodes.map((n, i) => ({ x: n.x * COL_W, y: i * NODE_HEIGHT + NODE_R }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const c = pts[i], nx = pts[i + 1], my = (c.y + nx.y) / 2;
        d += ` C ${c.x} ${my}, ${nx.x} ${my}, ${nx.x} ${nx.y}`;
    }
    return d;
}

/* ─── Tree ───────────────────────────────────────────────── */
const Tree: React.FC<{ size: number; opacity: number; flip?: boolean; delay?: number }> = ({ size, opacity, flip, delay = 0 }) => (
    <motion.div
        animate={{ rotate: [0, 1.6, -1.6, 0] }}
        transition={{ duration: 5.5 + delay * 0.4, repeat: Infinity, ease: 'easeInOut', delay }}
        style={{ transformOrigin: 'bottom center', display: 'inline-block' }}
    >
        <svg width={size} height={size * 1.75} viewBox="0 0 40 70" fill="white"
            style={{ opacity, transform: flip ? 'scaleX(-1)' : undefined, display: 'block' }}>
            <rect x="17" y="54" width="6" height="16" rx="2" fillOpacity="0.45" />
            <polygon points="20,2 33,24 7,24"   fillOpacity="0.95" />
            <polygon points="20,14 35,38 5,38"  fillOpacity="0.72" />
            <polygon points="20,27 37,52 3,52"  fillOpacity="0.52" />
        </svg>
    </motion.div>
);

/* ─── Floating particle ──────────────────────────────────── */
const Particle: React.FC<{ x: number; y: number; delay: number; size?: number }> = ({ x, y, delay, size = 2 }) => (
    <motion.div
        className="absolute rounded-full bg-white pointer-events-none"
        style={{ left: x, top: y, width: size, height: size }}
        animate={{ opacity: [0, 0.55, 0], y: [0, -18, -30], scale: [0.8, 1.3, 0.5] }}
        transition={{ duration: 3.5 + delay, repeat: Infinity, ease: 'easeOut', delay }}
    />
);

/* ─── Animated dashed path length tracker ────────────────── */
const AnimatedTrail: React.FC<{ d: string; totalH: number }> = ({ d, totalH }) => {
    const pathRef = useRef<SVGPathElement>(null);
    const [len, setLen] = useState(0);
    useEffect(() => { if (pathRef.current) setLen(pathRef.current.getTotalLength()); }, [d]);

    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ width: COL_W, height: totalH, overflow: 'visible' }}>
            <defs>
                <filter id="jglow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="12" result="b" />
                    <feComposite in="SourceGraphic" in2="b" operator="over" />
                </filter>
            </defs>

            {/* Wide ambient glow */}
            <path d={d} stroke="rgba(255,255,255,0.018)" strokeWidth="72" fill="none" strokeLinecap="round" />
            {/* Trail body */}
            <path d={d} stroke="rgba(255,255,255,0.07)" strokeWidth="20" fill="none" strokeLinecap="round" filter="url(#jglow)" />
            <path d={d} stroke="rgba(255,255,255,0.11)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d={d} stroke="rgba(255,255,255,0.20)" strokeWidth="4"  fill="none" strokeLinecap="round" />

            {/* Animated dashes flowing down the path */}
            {len > 0 && (
                <motion.path
                    ref={pathRef}
                    d={d}
                    stroke="rgba(255,255,255,0.38)"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`7 18`}
                    animate={{ strokeDashoffset: [0, -(7 + 18) * 2] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                />
            )}

            {/* Static thin dash fallback while len calculates */}
            {len === 0 && (
                <path ref={pathRef} d={d} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"
                    fill="none" strokeLinecap="round" strokeDasharray="7 18" />
            )}
        </svg>
    );
};

/* ─── Node component ─────────────────────────────────────── */
const TrailNode: React.FC<{
    node: PathNode; index: number; isActive: boolean;
    nodeRef?: React.Ref<HTMLDivElement>;
    navigate: (path: string) => void;
}> = ({ node, index, isActive, nodeRef, navigate }) => {
    const isMilestone = node.isMilestone;
    const nodeSize  = isMilestone ? 76 : 64;
    const iconSize  = isMilestone ? 30 : 24;

    // Label side: alternate based on x position
    const labelLeft = node.x < 0.5;
    const labelClass = labelLeft
        ? 'right-[calc(100%+12px)] top-1/2 -translate-y-1/2 text-right'
        : 'left-[calc(100%+12px)]  top-1/2 -translate-y-1/2 text-left';

    return (
        <div ref={nodeRef} className="absolute z-20" style={{
            left: node.x * COL_W, top: index * NODE_HEIGHT + NODE_R,
            transform: 'translate(-50%, -50%)',
        }}>
            {/* Multi-ring glow for active */}
            {isActive && (
                <>
                    <motion.div
                        className="absolute inset-0 rounded-full bg-white/8"
                        style={{ inset: -18 }}
                        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute rounded-full bg-white/12"
                        style={{ inset: -10 }}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0.2, 0.8] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    />
                </>
            )}

            {/* Milestone glow */}
            {isMilestone && !isActive && node.isCompleted && (
                <div className="absolute rounded-full bg-white/10 blur-lg" style={{ inset: -8 }} />
            )}

            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: Math.min(index * 0.018, 0.65), type: 'spring', stiffness: 280, damping: 20 }}
                whileHover={node.isUnlocked ? { scale: 1.13 } : {}}
                whileTap={node.isUnlocked ? { scale: 0.9 } : {}}
                onClick={() => node.isUnlocked && navigate(`/bible/${node.abbrevPt}`)}
                style={{ width: nodeSize, height: nodeSize }}
                className={cn(
                    'relative flex items-center justify-center rounded-full transition-colors z-10',
                    node.isCompleted
                        ? isMilestone
                            ? 'bg-white border-[3px] border-white text-black shadow-[0_0_30px_rgba(255,255,255,0.25)]'
                            : 'bg-white border-[2.5px] border-white/70 text-black shadow-[0_2px_16px_rgba(255,255,255,0.15)]'
                        : isActive
                            ? 'bg-white border-[3px] border-white text-black shadow-[0_4px_48px_rgba(255,255,255,0.45)]'
                            : node.isUnlocked
                                ? 'bg-[#0e0e0e] border-[2px] border-white/14 text-white/35 hover:border-white/32 hover:text-white/65'
                                : 'bg-[#080808] border-[2px] border-white/6  text-white/14 cursor-not-allowed'
                )}
            >
                {node.isCompleted ? (
                    isMilestone
                        ? <Crown size={iconSize} />
                        : <CheckCircle2 size={iconSize} strokeWidth={2.5} />
                ) : isActive ? (
                    isMilestone
                        ? <Flame size={iconSize} />
                        : <Star size={iconSize} className="fill-black" />
                ) : !node.isUnlocked ? (
                    <Lock size={16} strokeWidth={2} />
                ) : (
                    <span className="font-black text-[11px] tracking-tight leading-none text-center">
                        {node.name.substring(0, 3).toUpperCase()}
                    </span>
                )}

                {/* Pulsing halo badge for current */}
                {isActive && (
                    <motion.div
                        className="absolute -top-2 -right-2 w-[22px] h-[22px] bg-white rounded-full flex items-center justify-center shadow-[0_0_14px_rgba(255,255,255,0.9)]"
                        animate={{ rotate: [0, 30, -30, 0] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Star size={10} className="text-black fill-black" />
                    </motion.div>
                )}

                {/* Number badge on completed */}
                {node.isCompleted && !isMilestone && (
                    <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] bg-[#060606] border border-white/20 rounded-full flex items-center justify-center">
                        <span className="text-[7px] font-black text-white/50 leading-none">{index + 1}</span>
                    </div>
                )}
            </motion.button>

            {/* Floating label — alternates side based on x position */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(index * 0.018 + 0.15, 0.8) }}
                className={`absolute whitespace-nowrap pointer-events-none ${labelClass}`}
            >
                <span className={cn(
                    'text-[10px] font-black tracking-wider uppercase leading-none block',
                    node.isCompleted ? 'text-white/28'
                        : isActive      ? 'text-white font-black text-[11px]'
                        : node.isUnlocked ? 'text-white/18'
                        : 'text-white/9'
                )}>
                    {node.name}
                    {isMilestone && !node.isCompleted && !isActive && (
                        <span className="block text-[8px] text-white/20 normal-case tracking-normal mt-0.5 font-bold not-italic">marco</span>
                    )}
                </span>
            </motion.div>
        </div>
    );
};

/* ─── Inner map ──────────────────────────────────────────── */
function JourneyMap({ nodes, navigate }: { nodes: PathNode[]; navigate: (p: string) => void }) {
    const currentNodeRef = useRef<HTMLDivElement>(null);
    const svgPath  = useMemo(() => buildPath(nodes), [nodes]);
    const totalH   = nodes.length * NODE_HEIGHT + NODE_R * 2 + 180;

    const firstCurrentIdx = useMemo(() => {
        const i = nodes.findIndex(n => n.isCurrent);
        return i >= 0 ? i : 0;
    }, [nodes]);

    useEffect(() => {
        setTimeout(() => currentNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);
    }, []);

    /* decorations */
    const { leftTrees, rightTrees, particles, fogBlobs } = useMemo(() => {
        const rnd  = seededRand(77);
        const n    = nodes.length;
        const step = totalH / (n + 3);

        const leftTrees = Array.from({ length: n + 6 }).map((_, i) => ({
            id: i, x: -12 + rnd() * 58, y: i * step + rnd() * 55 - 20,
            size: 18 + rnd() * 38, opacity: 0.05 + rnd() * 0.13, delay: rnd() * 4,
        }));
        const rightTrees = Array.from({ length: n + 6 }).map((_, i) => ({
            id: i + 300, x: COL_W + 10 + rnd() * 58, y: i * step + rnd() * 55 - 20,
            size: 16 + rnd() * 36, opacity: 0.05 + rnd() * 0.13, delay: rnd() * 4,
        }));
        const particles = Array.from({ length: 40 }).map((_, i) => ({
            id: i, x: rnd() * (COL_W + 120) - 60, y: rnd() * totalH,
            delay: rnd() * 5, size: rnd() > 0.8 ? 3 : 2,
        }));
        const fogBlobs = Array.from({ length: 14 }).map((_, i) => ({
            id: i, x: rnd() * COL_W - 80,
            y: rnd() * totalH, w: 140 + rnd() * 240, h: 55 + rnd() * 90,
            opacity: 0.018 + rnd() * 0.028,
        }));
        return { leftTrees, rightTrees, particles, fogBlobs };
    }, [totalH, nodes.length]);

    const completedCount = nodes.filter(n => n.isCompleted).length;

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 relative" style={{ WebkitOverflowScrolling: 'touch' }}>

            {/* Progress bar sticky */}
            <div className="sticky top-0 z-50 px-8 pt-[88px] pb-3 bg-gradient-to-b from-[#060606] via-[#060606]/95 to-transparent pointer-events-none">
                <div className="max-w-sm mx-auto">
                    <div className="flex justify-between mb-1.5">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Caminhando</span>
                        <span className="text-[9px] font-black text-white/28">{completedCount} / {nodes.length} livros</span>
                    </div>
                    <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedCount / nodes.length) * 100}%` }}
                            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.5 }}
                            className="h-full bg-white/45 rounded-full"
                        />
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div className="relative mx-auto" style={{ width: COL_W, height: totalH }}>

                {/* Fog */}
                {fogBlobs.map(b => (
                    <div key={`fg-${b.id}`} className="absolute rounded-full pointer-events-none blur-3xl bg-white"
                        style={{ left: b.x, top: b.y, width: b.w, height: b.h, opacity: b.opacity }} />
                ))}

                {/* Forests */}
                {leftTrees.map(t => (
                    <div key={`l-${t.id}`} className="absolute pointer-events-none" style={{ left: t.x, top: t.y }}>
                        <Tree size={t.size} opacity={t.opacity} delay={t.delay} />
                    </div>
                ))}
                {rightTrees.map(t => (
                    <div key={`r-${t.id}`} className="absolute pointer-events-none" style={{ left: t.x, top: t.y }}>
                        <Tree size={t.size} opacity={t.opacity} flip delay={t.delay} />
                    </div>
                ))}

                {/* Floating particles */}
                {particles.map(p => <Particle key={`p-${p.id}`} x={p.x} y={p.y} delay={p.delay} size={p.size} />)}

                {/* Animated trail */}
                <AnimatedTrail d={svgPath} totalH={totalH} />

                {/* Nodes */}
                {nodes.map((node, i) => (
                    <TrailNode
                        key={node.id}
                        node={node}
                        index={i}
                        isActive={i === firstCurrentIdx}
                        nodeRef={i === firstCurrentIdx ? currentNodeRef : undefined}
                        navigate={navigate}
                    />
                ))}

                {/* Bottom curtain */}
                <div className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, transparent, #060606)' }} />
            </div>

            {nodes.every(n => n.isCompleted) && (
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-20 gap-4">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.5)]">
                        <Crown size={38} className="text-black" />
                    </div>
                    <p className="text-sm font-black text-white/40 uppercase tracking-widest text-center">
                        Jornada concluída!<br />Glória ao Senhor.
                    </p>
                </motion.div>
            )}
        </div>
    );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function Journey() {
    const navigate = useNavigate();
    const [stats]  = useState(statsService.getStats());
    const [filter, setFilter] = useState<'VT' | 'NT' | null>(null);

    const mapNodes = useMemo((): PathNode[] => {
        if (!filter) return [];
        return STATIC_BOOKS
            .filter(b => b.testament === filter)
            .map((book, i) => {
                const isCompleted = statsService.isBookCompleted(book.abbrev.pt);
                return {
                    id: book.abbrev.pt, name: book.name, abbrevPt: book.abbrev.pt,
                    isCompleted, isUnlocked: true, isCurrent: !isCompleted,
                    isMilestone: MILESTONE_BOOKS.has(book.abbrev.pt),
                    index: i, x: POSITIONS[i % POSITIONS.length],
                };
            });
    }, [stats, filter]);

    const choices = [
        { label: 'Antigo Testamento', sub: 'Gênesis a Malaquias · 39 livros', f: 'VT' as const, Icon: Mountain },
        { label: 'Novo Testamento',   sub: 'Mateus a Apocalipse · 27 livros', f: 'NT' as const, Icon: Sparkles },
    ];

    return (
        <PageTransition>
            <div className="h-screen bg-[#060606] text-white flex flex-col overflow-hidden selection:bg-white selection:text-black">

                <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-5 flex items-center justify-between bg-[#060606]/90 backdrop-blur-xl border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')}
                            className="p-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div>
                            <span className="text-[10px] font-black tracking-[0.35em] text-white/20 uppercase block">O Caminho</span>
                            <h1 className="text-xl font-black italic tracking-tight">Jornada Bíblica</h1>
                        </div>
                    </div>
                    {filter && (
                        <button onClick={() => setFilter(null)}
                            className="px-5 py-2 bg-white/5 border border-white/8 rounded-full text-[10px] font-black tracking-widest uppercase text-white/35 hover:bg-white/10 hover:text-white transition-all">
                            Mudar
                        </button>
                    )}
                </header>

                <AnimatePresence>
                    {!filter && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                            className="fixed inset-0 z-[90] bg-[#060606] flex flex-col items-center justify-center p-8 pt-28"
                        >
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {Array.from({ length: 110 }).map((_, i) => (
                                    <motion.div key={i} className="absolute rounded-full bg-white"
                                        style={{
                                            left: `${(i * 137.5) % 100}%`, top: `${(i * 97.3) % 100}%`,
                                            width: i % 9 === 0 ? 2.5 : 1, height: i % 9 === 0 ? 2.5 : 1,
                                            opacity: 0.025 + (i % 11) * 0.01,
                                        }}
                                        animate={{ opacity: [0.03, 0.12, 0.03] }}
                                        transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: i * 0.05 % 4 }}
                                    />
                                ))}
                            </div>

                            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="text-center mb-12 relative z-10">
                                <span className="text-[10px] font-black tracking-[0.45em] text-white/18 uppercase block mb-3">Escolha sua trilha</span>
                                <h2 className="text-4xl font-black italic tracking-tight">Por onde começar?</h2>
                            </motion.div>

                            <div className="flex flex-col gap-4 w-full max-w-sm relative z-10">
                                {choices.map(({ label, sub, f, Icon }, idx) => (
                                    <motion.button key={f}
                                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.18 + idx * 0.08 }}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => setFilter(f)}
                                        className="p-7 bg-white/[0.03] border border-white/8 rounded-[2rem] flex items-center gap-5 group hover:bg-white/[0.06] hover:border-white/16 transition-colors"
                                    >
                                        <div className="w-13 h-13 w-[52px] h-[52px] rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Icon size={24} className="text-white/45" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-xl font-black tracking-tight mb-0.5">{label}</h4>
                                            <p className="text-white/28 text-sm italic">{sub}</p>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {filter && <JourneyMap nodes={mapNodes} navigate={navigate} />}
            </div>
        </PageTransition>
    );
}
