import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Mountain,
    TreePine,
    Sparkles,
    Compass,
    Lock,
    CheckCircle2
} from 'lucide-react';
import { statsService } from '../services/features/statsService';
import { STATIC_BOOKS } from '../services/bible/staticBibleData';
import ParticleBackground from '../components/ParticleBackground';
import PageTransition from '../components/PageTransition';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const MAP_SIZE = 4000;
const NODE_SPACING = 300;
const SPIRAL_A = 120;
const SPIRAL_B = 40;

const LCG = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
};

const CloudLayer = ({ count = 20, seed = 42, speed = 0.05 }: { count?: number; seed?: number; speed?: number }) => {
    const rnd = LCG(seed);
    const clouds = useMemo(() => Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: rnd() * MAP_SIZE,
        y: rnd() * MAP_SIZE,
        size: 200 + rnd() * 400,
        opacity: 0.1 + rnd() * 0.2,
        duration: 20 + rnd() * 40,
    })), [count, rnd]);

    return (
        <div className="absolute inset-0 pointer-events-none z-[40]">
            {clouds.map(cloud => (
                <motion.div
                    key={cloud.id}
                    className="absolute bg-white/10 rounded-full blur-[60px]"
                    style={{
                        left: cloud.x,
                        top: cloud.y,
                        width: cloud.size,
                        height: cloud.size * 0.6,
                        opacity: cloud.opacity,
                    }}
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{
                        duration: cloud.duration,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};

export default function Journey() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(statsService.getStats());
    const [testamentFilter, setTestamentFilter] = useState<'VT' | 'NT' | null>(null);
    const [zoom, setZoom] = useState(1);
    const mapZoom = useMotionValue(1);
    const constraintsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setStats(statsService.getStats());
    }, []);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2));
            }
        };
        const container = constraintsRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

    useEffect(() => {
        mapZoom.set(zoom);
    }, [zoom, mapZoom]);

    const mapNodes = useMemo(() => {
        const nodes = [];
        let theta = 0;
        let r = SPIRAL_A;

        const filteredBooks = testamentFilter
            ? STATIC_BOOKS.filter(b => b.testament === testamentFilter)
            : STATIC_BOOKS;

        for (let i = 0; i < filteredBooks.length; i++) {
            const book = filteredBooks[i];
            const noiseX = Math.sin(i * 2.1) * 60;
            const noiseY = Math.cos(i * 1.7) * 60;
            const x = MAP_SIZE / 2 + r * Math.cos(theta) + noiseX;
            const y = MAP_SIZE / 2 + r * Math.sin(theta) + noiseY;
            const isCompleted = statsService.isBookCompleted(book.abbrev.pt);
            const isUnlocked = true;

            nodes.push({
                ...book,
                index: i,
                x,
                y,
                isCompleted,
                isUnlocked,
                isCurrent: isUnlocked && !isCompleted
            });

            const dTheta = NODE_SPACING / r;
            theta += dTheta;
            r = SPIRAL_A + SPIRAL_B * theta;
        }
        return nodes;
    }, [stats, testamentFilter]);

    const currentBookNode = useMemo(() => {
        const abbrev = statsService.getLastReadBook();
        const node = mapNodes.find(n => n.abbrev.pt === abbrev);
        return node || mapNodes.find(n => n.isCurrent) || mapNodes[0];
    }, [mapNodes]);

    const initialX = useMemo(() => {
        if (!currentBookNode) return 0;
        const winWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth, 1280) : 1000;
        return (winWidth / 2) - currentBookNode.x;
    }, [currentBookNode?.x]);

    const initialY = useMemo(() => {
        if (!currentBookNode) return 0;
        const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
        return (winHeight / 2) - currentBookNode.y;
    }, [currentBookNode?.y]);

    const mapX = useMotionValue(initialX);
    const mapY = useMotionValue(initialY);

    useEffect(() => {
        mapX.set(initialX);
        mapY.set(initialY);
    }, [initialX, initialY, mapX, mapY]);

    const decorations = useMemo(() => {
        const rnd = LCG(12345);
        return Array.from({ length: 150 }).map((_, i) => {
            const x = rnd() * MAP_SIZE;
            const y = rnd() * MAP_SIZE;
            const type = rnd();
            const size = 16 + rnd() * 48;
            const opacity = 0.05 + rnd() * 0.15;
            let Icon = Mountain;
            if (type > 0.8) Icon = TreePine;
            else if (type > 0.6) Icon = Sparkles;
            else if (type > 0.4) Icon = Compass;

            const depth = rnd();
            let layer: 'far' | 'mid' | 'near' = 'mid';
            if (depth < 0.3) layer = 'far';
            else if (depth > 0.7) layer = 'near';

            return { id: i, x, y, size, opacity, Icon, layer };
        });
    }, []);

    const farX = useTransform(mapX, (x) => (x - initialX) * -0.15);
    const farY = useTransform(mapY, (y) => (y - initialY) * -0.15);
    const nearX = useTransform(mapX, (x) => (x - initialX) * 0.15);
    const nearY = useTransform(mapY, (y) => (y - initialY) * 0.15);

    const farNodes = useMemo(() => decorations.filter(d => d.layer === 'far'), [decorations]);
    const midNodes = useMemo(() => decorations.filter(d => d.layer === 'mid'), [decorations]);
    const nearNodes = useMemo(() => decorations.filter(d => d.layer === 'near'), [decorations]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black relative overflow-hidden">
                <ParticleBackground />
                
                {/* Header Overlay */}
                <header className="fixed top-0 left-0 right-0 z-[100] p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <span className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase mb-0.5 block italic">O Caminho</span>
                            <h1 className="text-2xl font-bold tracking-tight italic">Jornada Bíblica</h1>
                        </div>
                    </div>
                    {testamentFilter && (
                        <button
                            onClick={() => setTestamentFilter(null)}
                            className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/60 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
                        >
                            Mudar Testamento
                        </button>
                    )}
                </header>

                {/* Map Container - Full Screen */}
                <div ref={constraintsRef} className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
                    {/* Testament Selection Overlay */}
                    <AnimatePresence>
                    {!testamentFilter && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[60] backdrop-blur-2xl bg-black/60 flex items-center justify-center p-8"
                        >
                            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setTestamentFilter('VT')}
                                    className="p-16 bg-white/[0.04] border border-white/10 rounded-[3rem] text-center group transition-all"
                                >
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                                        <Mountain size={40} className="text-white/60" />
                                    </div>
                                    <h4 className="text-3xl font-bold mb-3 tracking-tight">Antigo Testamento</h4>
                                    <p className="text-white/30 text-base font-normal italic">Gênesis a Malaquias</p>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setTestamentFilter('NT')}
                                    className="p-16 bg-white/[0.04] border border-white/10 rounded-[3rem] text-center group transition-all"
                                >
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                                        <Sparkles size={40} className="text-white" />
                                    </div>
                                    <h4 className="text-3xl font-bold mb-3 tracking-tight">Novo Testamento</h4>
                                    <p className="text-white/30 text-base font-normal italic">Mateus a Apocalipse</p>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Hint overlay */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 pointer-events-none opacity-40">
                        <Compass size={16} className="text-white/40" />
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">Arraste para explorar o mapa</span>
                    </div>

                    <motion.div
                        drag
                        dragConstraints={constraintsRef}
                        dragElastic={0.1}
                        style={{
                            width: MAP_SIZE,
                            height: MAP_SIZE,
                            x: mapX,
                            y: mapY,
                            scale: mapZoom,
                        }}
                        className="absolute"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />

                        <motion.div style={{ x: farX, y: farY }} className="absolute inset-0 pointer-events-none">
                            {farNodes.map(dec => (
                                <div key={dec.id} className="absolute text-white/40" style={{ left: dec.x, top: dec.y, opacity: dec.opacity, transform: `translate(-50%, -50%) rotate(${dec.id % 2 === 0 ? 15 : -15}deg)` }}>
                                    <dec.Icon size={dec.size * 0.8} strokeWidth={1} />
                                </div>
                            ))}
                        </motion.div>

                        <div className="absolute inset-0 pointer-events-none">
                            {midNodes.map(dec => (
                                <div key={dec.id} className="absolute text-white/60" style={{ left: dec.x, top: dec.y, opacity: dec.opacity, transform: `translate(-50%, -50%) rotate(${dec.id % 2 === 0 ? 15 : -15}deg)` }}>
                                    <dec.Icon size={dec.size} strokeWidth={1} />
                                </div>
                            ))}
                        </div>

                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                            <defs>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="5" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            {Array.from({ length: mapNodes.length - 1 }).map((_, i) => {
                                const start = mapNodes[i];
                                const end = mapNodes[i + 1];
                                if (!start || !end) return null;
                                const strokeColor = "rgba(255,255,255,0.8)";
                                const cx1 = start.x + (end.x - start.x) * 0.5 + Math.sin(i) * 50;
                                const cy1 = start.y + (end.y - start.y) * 0.5 + Math.cos(i) * 50;
                                return (
                                    <React.Fragment key={i}>
                                        <path d={`M ${start.x} ${start.y} Q ${cx1} ${cy1} ${end.x} ${end.y}`} stroke="rgba(255,255,255,0.2)" strokeWidth="12" fill="none" strokeLinecap="round" filter="url(#glow)" />
                                        <path d={`M ${start.x} ${start.y} Q ${cx1} ${cy1} ${end.x} ${end.y}`} stroke={strokeColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                                    </React.Fragment>
                                );
                            })}
                        </svg>

                        <CloudLayer />

                        <motion.div style={{ x: nearX, y: nearY }} className="absolute inset-0 pointer-events-none z-20">
                            {nearNodes.map(dec => (
                                <div key={dec.id} className="absolute text-white" style={{ left: dec.x, top: dec.y, opacity: dec.opacity * 1.5, transform: `translate(-50%, -50%) rotate(${dec.id % 2 === 0 ? 15 : -15}deg)`, filter: 'blur(1px)' }}>
                                    <dec.Icon size={dec.size * 1.2} strokeWidth={1} />
                                </div>
                            ))}
                        </motion.div>

                        {mapNodes.map((node) => {
                            return (
                                <div key={node.abbrev.pt} className="absolute" style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}>
                                    <motion.button
                                        whileHover={node.isUnlocked ? { scale: 1.15 } : {}}
                                        whileTap={node.isUnlocked ? { scale: 0.95 } : {}}
                                        onClick={() => node.isUnlocked && navigate(`/bible/${node.abbrev.pt}`)}
                                        className={cn(
                                            "relative w-[70px] h-[70px] rounded-full flex flex-col items-center justify-center transition-all border-4 z-10 shadow-xl backdrop-blur-sm",
                                            node.isCompleted
                                                ? "bg-amber-400/90 border-amber-200 text-amber-950 shadow-[0_0_40px_rgba(251,191,36,0.3)]"
                                                : node.isCurrent
                                                    ? "bg-white border-white text-black shadow-[0_0_60px_rgba(255,255,255,0.8)] ring-4 ring-white/30 animate-[pulse_3s_ease-in-out_infinite]"
                                                    : "bg-black/60 border-white/10 text-white/30 hover:bg-black/80"
                                        )}
                                    >
                                        {node.isCompleted ? (
                                            <CheckCircle2 size={30} className="text-amber-900" />
                                        ) : !node.isUnlocked ? (
                                            <Lock size={20} className="opacity-50" />
                                        ) : (
                                            <span className="font-black text-xl tracking-tighter leading-none">{node.name.substring(0, 3)}</span>
                                        )}

                                        <motion.div 
                                            className="absolute top-[80px] w-auto whitespace-nowrap text-center pointer-events-none"
                                            initial={{ rotateY: 0 }}
                                            whileHover={{ rotateY: 30, x: 5 }}
                                            style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
                                        >
                                            <span className={cn(
                                                "text-xs font-bold tracking-tight rounded-lg px-3 py-1.5 shadow-xl transition-all block",
                                                node.isCurrent
                                                    ? "bg-white text-black"
                                                    : node.isUnlocked
                                                        ? "bg-black/90 text-white border border-white/20"
                                                        : "bg-black/40 text-white/30 border border-white/5"
                                            )}>
                                                {node.name}
                                            </span>
                                        </motion.div>
                                    </motion.button>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </PageTransition>
    );
}
