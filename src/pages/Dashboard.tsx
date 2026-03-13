import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { motion } from 'motion/react';
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
    Palette,
    Mountain,
    TreePine,
    Map as MapIcon,
    Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import ParticleBackground from '../components/ParticleBackground';
import CustomizationModal from '../components/CustomizationModal';
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

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const { profile } = useProfile();
    const navigate = useNavigate();
    const { preferences } = usePreferences();
    const [stats, setStats] = useState(statsService.getStats());
    const [showCustomization, setShowCustomization] = useState(false);

    const lastBookAbbrev = useMemo(() => statsService.getLastReadBook() || 'gn', []);
    const selectedBook = useMemo(() =>
        STATIC_BOOKS.find(b => b.abbrev.pt === lastBookAbbrev) || STATIC_BOOKS[0],
        [lastBookAbbrev]);

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
        
        for (let i = 0; i < STATIC_BOOKS.length; i++) {
            const book = STATIC_BOOKS[i];
            
            const noiseX = Math.sin(i * 2.1) * 60;
            const noiseY = Math.cos(i * 1.7) * 60;
            
            const x = MAP_SIZE / 2 + r * Math.cos(theta) + noiseX;
            const y = MAP_SIZE / 2 + r * Math.sin(theta) + noiseY;
            
            const isCompleted = statsService.isBookCompleted(book.abbrev.pt);
            let isUnlocked = i === 0 || i === 39;
            if (!isUnlocked && i > 0) {
                isUnlocked = statsService.isBookCompleted(STATIC_BOOKS[i - 1].abbrev.pt);
            }

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
    }, [stats]);
    
    const currentBookNode = useMemo(() => {
        const abbrev = statsService.getLastReadBook();
        const node = mapNodes.find(n => n.abbrev.pt === abbrev);
        return node || mapNodes.find(n => n.isCurrent) || mapNodes[0];
    }, [mapNodes]);

    const initialX = useMemo(() => {
        const winWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth, 1280) : 1000;
        return (winWidth / 2) - currentBookNode.x;
    }, [currentBookNode.x]);
    
    const initialY = useMemo(() => {
        return 300 - currentBookNode.y;
    }, [currentBookNode.y]);

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
            return { id: i, x, y, size, opacity, Icon };
        });
    }, []);

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
                            onClick={() => setShowCustomization(true)}
                            title="Personalizar App"
                            className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                        >
                            <Palette size={20} />
                        </button>
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
                                <div key="journey" className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <span className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase mb-1 block italic">O Caminho</span>
                                            <h3 className="text-3xl font-bold tracking-tight italic">Jornada Bíblica.</h3>
                                        </div>
                                    </div>

                                    {/* Interactive 2D Map Container */}
                                    <div ref={constraintsRef} className="relative h-[600px] overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/5 cursor-grab active:cursor-grabbing group">
                                        {/* Overlay hint */}
                                        <div className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Compass size={14} className="text-white/40" />
                                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Arraste para explorar</span>
                                        </div>
                                        
                                        <motion.div
                                            drag
                                            dragConstraints={constraintsRef}
                                            dragElastic={0.1}
                                            initial={{ x: initialX, y: initialY }}
                                            className="absolute"
                                            style={{ width: MAP_SIZE, height: MAP_SIZE }}
                                        >
                                            {/* Map Grid/Texture */}
                                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />
                                            
                                            {/* Decorations */}
                                            {decorations.map(dec => (
                                                <div 
                                                    key={dec.id} 
                                                    className="absolute pointer-events-none text-white transition-opacity"
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

                                            {/* Sinuous Path Background */}
                                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0">
                                                {Array.from({ length: STATIC_BOOKS.length - 1 }).map((_, i) => {
                                                    if (i === 38) return null; // Break line between OT and NT
                                                    
                                                    const start = mapNodes[i];
                                                    const end = mapNodes[i + 1];
                                                    
                                                    const strokeColor = end.isUnlocked ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)";
                                                    
                                                    const cx1 = start.x + (end.x - start.x) * 0.5 + Math.sin(i) * 50;
                                                    const cy1 = start.y + (end.y - start.y) * 0.5 + Math.cos(i) * 50;
                                                    
                                                    return (
                                                        <path
                                                            key={i}
                                                            d={`M ${start.x} ${start.y} Q ${cx1} ${cy1} ${end.x} ${end.y}`}
                                                            stroke={strokeColor}
                                                            strokeWidth="8"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeDasharray={end.isUnlocked ? "none" : "12 12"}
                                                        />
                                                    );
                                                })}
                                            </svg>

                                            {/* Map Nodes (Books) */}
                                            {mapNodes.map((node) => {
                                                const isNTMarker = node.index === 39;
                                                const isOTMarker = node.index === 0;
                                                
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
                                                        {isOTMarker && (
                                                            <div className="absolute z-20 pointer-events-none flex flex-col items-center" style={{ left: '50%', top: -120, transform: 'translateX(-50%)' }}>
                                                                <span className="bg-black/80 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full text-xs font-black tracking-[0.3em] uppercase text-white shadow-2xl whitespace-nowrap">
                                                                    Antigo Testamento
                                                                </span>
                                                                <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent mt-2" />
                                                            </div>
                                                        )}
                                                        {isNTMarker && (
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
                                                        >
                                                            {node.isCompleted ? (
                                                                <CheckCircle2 size={30} className="text-amber-900" />
                                                            ) : !node.isUnlocked ? (
                                                                <Lock size={20} className="opacity-50" />
                                                            ) : (
                                                                <span className="font-black text-xl tracking-tighter leading-none">{node.name.substring(0, 3)}</span>
                                                            )}
                                                            
                                                            {/* Label underneath */}
                                                            <div className="absolute top-[80px] w-auto whitespace-nowrap text-center pointer-events-none">
                                                                <span className={cn(
                                                                    "text-xs font-bold tracking-tight rounded-lg px-3 py-1.5 shadow-xl transition-all",
                                                                    node.isCurrent
                                                                        ? "bg-white text-black"
                                                                        : node.isUnlocked 
                                                                            ? "bg-black/90 text-white border border-white/20" 
                                                                            : "bg-black/40 text-white/30 border border-white/5"
                                                                )}>
                                                                    {node.name}
                                                                </span>
                                                            </div>
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
            
            <CustomizationModal isOpen={showCustomization} onClose={() => setShowCustomization(false)} />
        </div>
        </PageTransition>
    );
}
