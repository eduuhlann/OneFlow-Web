import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { motion, useMotionValue, useTransform } from 'motion/react';
import {
    BookOpen,
    Settings,
    LogOut,
    BrainCircuit,
    Calendar,
    Sparkles,
    ChevronRight,
    TrendingUp,
    Clock,
    CheckCircle2,
    Lock,
    User,
    Heart,
    Mountain,
    TreePine,
    Map as MapIcon,
    Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import ParticleBackground from '../components/ParticleBackground';
import PageTransition from '../components/PageTransition';
import { statsService } from '../services/features/statsService';
import { STATIC_BOOKS } from '../services/bible/staticBibleData';
import { usePreferences } from '../contexts/PreferencesContext';
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


export default function Dashboard() {
    const { user, signOut } = useAuth();
    const { profile } = useProfile();
    const navigate = useNavigate();
    const { preferences } = usePreferences();
    const [stats, setStats] = useState(statsService.getStats());
    const [testamentFilter, setTestamentFilter] = useState<'VT' | 'NT' | null>(null);

    const lastBookAbbrev = useMemo(() => statsService.getLastReadBook() || 'gn', []);
    const selectedBook = useMemo(() =>
        STATIC_BOOKS.find(b => b.abbrev.pt === lastBookAbbrev) || STATIC_BOOKS[0],
        [lastBookAbbrev]);

    const [zoom, setZoom] = useState(1);
    const mapZoom = useMotionValue(1);

    // Zoom handling
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

    useEffect(() => {
        setStats(statsService.getStats());
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const displayName = profile?.username || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

    const menuItems = [
        { icon: BookOpen, label: 'Bíblia', description: 'Continue sua leitura', path: '/bible' },
        { icon: BrainCircuit, label: 'Olyviah', description: 'IA Assistente Espiritual', path: '/olyviah' },
        { icon: Calendar, label: 'Planos', description: 'Sua jornada de estudo', path: '/plans' },
        { icon: Clock, label: 'Oração', description: 'Temporizador de oração', path: '/prayer' },
    ];

    const constraintsRef = useRef<HTMLDivElement>(null);

    // Calculate map state
    const mapNodes = useMemo(() => {
        const nodes = [];
        let theta = 0;
        let r = SPIRAL_A;

        // Filter books based on testament selection
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
            // ALL books are now unlocked
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
        return 300 - currentBookNode.y;
    }, [currentBookNode?.y]);

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

            const depth = rnd(); // 0 to 1
            let layer: 'far' | 'mid' | 'near' = 'mid';
            if (depth < 0.3) layer = 'far';
            else if (depth > 0.7) layer = 'near';

            return { id: i, x, y, size, opacity, Icon, layer };
        });
    }, []);

    // Motion values for parallax
    const mapX = useMotionValue(initialX);
    const mapY = useMotionValue(initialY);

    // Update map position when selection changes
    useEffect(() => {
        mapX.set(initialX);
        mapY.set(initialY);
    }, [initialX, initialY, mapX, mapY]);

    // Parallax transforms - adjusting the relative movement
    const farX = useTransform(mapX, (x) => (x - initialX) * -0.15);
    const farY = useTransform(mapY, (y) => (y - initialY) * -0.15);

    const nearX = useTransform(mapX, (x) => (x - initialX) * 0.15);
    const nearY = useTransform(mapY, (y) => (y - initialY) * 0.15);

    const farNodes = useMemo(() => decorations.filter(d => d.layer === 'far'), [decorations]);
    const midNodes = useMemo(() => decorations.filter(d => d.layer === 'mid'), [decorations]);
    const nearNodes = useMemo(() => decorations.filter(d => d.layer === 'near'), [decorations]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-black text-white p-6 md:p-12 overflow-x-hidden selection:bg-white selection:text-black relative">
                <ParticleBackground />
                <div className="max-w-7xl mx-auto relative z-10">

                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                        <div className="flex items-center gap-6">
                            <img src={logo} alt="OneFlow" className="w-24 md:w-28 h-auto object-contain" />
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase">Bem-vindo</span>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                                    {displayName}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Profile Avatar */}
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={18} className="text-white/40" />
                                )}
                            </div>
                            <button
                                onClick={() => navigate('/settings')}
                                title="Configurações e Perfil"
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                            >
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={handleSignOut}
                                title="Sair"
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95 text-red-500/80 hover:text-red-400"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </header>

                    <div className="space-y-8">
                        {/* Main Content: Mapped according to preferences.dashboardLayout */}
                        {preferences.dashboardLayout.map((layoutBlock) => {
                            if (layoutBlock === 'nav') {
                                return (
                                    <div key="nav" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                                        {menuItems.map((item, i) => (
                                            <motion.button
                                                key={i}
                                                whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                                onClick={() => navigate(item.path)}
                                                className="p-6 bg-white/[0.04] border border-white/10 rounded-3xl text-left group transition-all"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-all">
                                                    <item.icon size={20} className="text-white" />
                                                </div>
                                                <h3 className="text-base font-bold mb-1 tracking-tight">{item.label}</h3>
                                                <p className="text-white/30 text-xs font-normal italic leading-relaxed">{item.description}</p>
                                                <div className="mt-5 flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] text-white/20 group-hover:text-white transition-colors uppercase">
                                                    Acessar <ChevronRight size={10} />
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                );
                            }



                            if (layoutBlock === 'journey') {
                                return (
                                    <div key="journey" className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden relative">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <span className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase mb-1 block italic">O Caminho</span>
                                                    <h3 className="text-3xl font-bold tracking-tight italic">Jornada Bíblica</h3>
                                                </div>
                                                {testamentFilter && (
                                                    <button
                                                        onClick={() => setTestamentFilter(null)}
                                                        className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/40 hover:bg-white/10 hover:text-white transition-all"
                                                    >
                                                        Mudar Testamento
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Interactive 2D Map Container */}
                                        <div ref={constraintsRef} className="relative h-[600px] overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/5 cursor-grab active:cursor-grabbing group">

                                            {/* Testament Selection Overlay */}
                                            {!testamentFilter && (
                                                <div className="absolute inset-0 z-[60] backdrop-blur-xl bg-black/40 flex items-center justify-center p-8">
                                                    <div className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <motion.button
                                                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setTestamentFilter('VT')}
                                                            className="p-12 bg-white/[0.04] border border-white/10 rounded-[2rem] text-center group transition-all"
                                                        >
                                                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                                <Mountain size={32} className="text-white/60" />
                                                            </div>
                                                            <h4 className="text-2xl font-bold mb-2 tracking-tight">Antigo Testamento</h4>
                                                            <p className="text-white/30 text-sm font-normal italic">Gênesis a Malaquias</p>
                                                        </motion.button>

                                                        <motion.button
                                                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setTestamentFilter('NT')}
                                                            className="p-12 bg-white/[0.04] border border-white/10 rounded-[2rem] text-center group transition-all"
                                                        >
                                                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                                <Sparkles size={32} className="text-white" />
                                                            </div>
                                                            <h4 className="text-2xl font-bold mb-2 tracking-tight">Novo Testamento</h4>
                                                            <p className="text-white/30 text-sm font-normal italic">Mateus a Apocalipse</p>
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Overlay hint */}
                                            <div className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Compass size={14} className="text-white/40" />
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Arraste para explorar</span>
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
                                                    transformOrigin: 'center center',
                                                }}
                                                className="absolute"
                                            >
                                                {/* Map Grid/Texture */}
                                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />

                                                {/* Parallax Layer: Far */}
                                                <motion.div style={{ x: farX, y: farY }} className="absolute inset-0 pointer-events-none">
                                                    {farNodes.map(dec => (
                                                        <div
                                                            key={dec.id}
                                                            className="absolute text-white/40"
                                                            style={{
                                                                left: dec.x,
                                                                top: dec.y,
                                                                opacity: dec.opacity,
                                                                transform: `translate(-50%, -50%) rotate(${dec.id % 2 === 0 ? 15 : -15}deg)`
                                                            }}
                                                        >
                                                            <dec.Icon size={dec.size * 0.8} strokeWidth={1} />
                                                        </div>
                                                    ))}
                                                </motion.div>

                                                {/* Static Layer: Mid */}
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {midNodes.map(dec => (
                                                        <div
                                                            key={dec.id}
                                                            className="absolute text-white/60"
                                                            style={{
                                                                left: dec.x,
                                                                top: dec.y,
                                                                opacity: dec.opacity,
                                                                transform: `translate(-50%, -50%) rotate(${dec.id % 2 === 0 ? 15 : -15}deg)`
                                                            }}
                                                        >
                                                            <dec.Icon size={dec.size} strokeWidth={1} />
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Sinuous Path Background */}
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
                                                                {/* Idea 17: Emissive Tube (Glow Layer) */}
                                                                <path
                                                                    d={`M ${start.x} ${start.y} Q ${cx1} ${cy1} ${end.x} ${end.y}`}
                                                                    stroke="rgba(255,255,255,0.2)"
                                                                    strokeWidth="12"
                                                                    fill="none"
                                                                    strokeLinecap="round"
                                                                    filter="url(#glow)"
                                                                />
                                                                <path
                                                                    d={`M ${start.x} ${start.y} Q ${cx1} ${cy1} ${end.x} ${end.y}`}
                                                                    stroke={strokeColor}
                                                                    strokeWidth="4"
                                                                    fill="none"
                                                                    strokeLinecap="round"
                                                                />
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </svg>

                                                {/* Idea 5: Nuvens Volumétricas */}
                                                <CloudLayer />

                                                {/* Parallax Layer: Near */}
                                                <motion.div style={{ x: nearX, y: nearY }} className="absolute inset-0 pointer-events-none z-20">
                                                    {nearNodes.map(dec => (
                                                        <div
                                                            key={dec.id}
                                                            className="absolute text-white"
                                                            style={{
                                                                left: dec.x,
                                                                top: dec.y,
                                                                opacity: dec.opacity * 1.5,
                                                                transform: `translate(-50%, -50%) rotate(${dec.id % 2 === 0 ? 15 : -15}deg)`,
                                                                filter: 'blur(1px)'
                                                            }}
                                                        >
                                                            <dec.Icon size={dec.size * 1.2} strokeWidth={1} />
                                                        </div>
                                                    ))}
                                                </motion.div>

                                                {/* Map Nodes (Books) */}
                                                {mapNodes.map((node) => {
                                                    const isNTMarker = node.testament === 'NT' && node.index === 0;
                                                    const isOTMarker = node.testament === 'VT' && node.index === 0;

                                                    return (
                                                        <div
                                                            key={node.abbrev.pt}
                                                            className="absolute"
                                                            style={{
                                                                left: node.x,
                                                                top: node.y,
                                                                transform: 'translate(-50%, -50%)'
                                                            }}
                                                        >
                                                            {isOTMarker && !testamentFilter && (
                                                                <div className="absolute z-20 pointer-events-none flex flex-col items-center" style={{ left: '50%', top: -120, transform: 'translateX(-50%)' }}>
                                                                    <span className="bg-black/80 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full text-xs font-black tracking-[0.3em] uppercase text-white shadow-2xl whitespace-nowrap">
                                                                        Antigo Testamento
                                                                    </span>
                                                                    <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent mt-2" />
                                                                </div>
                                                            )}
                                                            {isNTMarker && !testamentFilter && (
                                                                <div className="absolute z-20 pointer-events-none flex flex-col items-center" style={{ left: '50%', top: -120, transform: 'translateX(-50%)' }}>
                                                                    <span className="bg-white text-black border border-white/20 px-6 py-3 rounded-full text-xs font-black tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(255,255,255,0.3)] whitespace-nowrap">
                                                                        Novo Testamento
                                                                    </span>
                                                                    <div className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent mt-2" />
                                                                </div>
                                                            )}

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
                                                                style={{
                                                                    boxShadow: `
                                                                        ${(node.x - MAP_SIZE / 2) * -0.05}px 
                                                                        ${(node.y - MAP_SIZE / 2) * -0.05}px 
                                                                        20px rgba(0,0,0,0.5)
                                                                    `
                                                                }}
                                                            >
                                                                {node.isCompleted ? (
                                                                    <CheckCircle2 size={30} className="text-amber-900" />
                                                                ) : !node.isUnlocked ? (
                                                                    <Lock size={20} className="opacity-50" />
                                                                ) : (
                                                                    <span className="font-black text-xl tracking-tighter leading-none">{node.name.substring(0, 3)}</span>
                                                                )}

                                                                {/* Label underneath */}
                                                                <motion.div 
                                                                    className="absolute top-[80px] w-auto whitespace-nowrap text-center pointer-events-none"
                                                                    initial={{ rotateY: 0 }}
                                                                    whileHover={{ rotateY: 30, x: 5, transition: { type: "spring", stiffness: 300 } }}
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
                                );
                            }

                            return null;
                        })}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}