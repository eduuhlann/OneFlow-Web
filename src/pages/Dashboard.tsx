import React, { useMemo, useState, useEffect } from 'react';
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
    Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import ParticleBackground from '../components/ParticleBackground';
import CustomizationModal from '../components/CustomizationModal';
import { statsService } from '../services/features/statsService';
import { STATIC_BOOKS } from '../services/bible/staticBibleData';
import { usePreferences } from '../contexts/PreferencesContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const LEVEL_HEIGHT = 120;

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

    const getLevelPosition = (index: number, width: number) => {
        // Map width logic based on container
        const centerX = width / 2;
        // creates a wider sine wave for the full map
        const amplitude = width * 0.35; 
        const xOffset = Math.sin(index * 0.6) * amplitude;
        return { x: centerX + xOffset, y: index * LEVEL_HEIGHT + 60 };
    };

    // Calculate map state
    const mapNodes = useMemo(() => {
        return STATIC_BOOKS.map((book, index) => {
            const isCompleted = statsService.isBookCompleted(book.abbrev.pt);
            
            // Genesis (0) and Matthew (39) are always unlocked
            let isUnlocked = index === 0 || index === 39;
            
            // Otherwise, unlock if previous book is completed
            if (!isUnlocked && index > 0) {
                isUnlocked = statsService.isBookCompleted(STATIC_BOOKS[index - 1].abbrev.pt);
            }

            return {
                ...book,
                index,
                isCompleted,
                isUnlocked,
                isCurrent: isUnlocked && !isCompleted
            };
        });
    }, [stats]);
    
    // We don't need totalChapters for the map, we need total books
    const totalBooks = STATIC_BOOKS.length;

    return (
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
                        
                        if (layoutBlock === 'stats') {
                            return (
                                <div key="stats" className="p-8 bg-white/[0.04] border border-white/10 rounded-[2.5rem] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 text-white/[0.02] pointer-events-none">
                                        <TrendingUp size={180} />
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase mb-3 block italic">Progresso Bíblico</span>
                                        <div className="flex items-end gap-3 mb-10 italic">
                                            <div className="text-6xl font-black tracking-tighter tabular-nums">
                                                {stats.completionPercentage.toFixed(1)}<span className="text-2xl font-normal opacity-20">%</span>
                                            </div>
                                            <div className="mb-2 text-white/20 font-bold text-sm">
                                                {stats.totalChaptersRead} de 1189 Cap.
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-8">
                                            {[
                                                { label: 'Livros', val: stats.booksTouched, icon: BookOpen },
                                                { label: 'Horas', val: `${stats.hoursRead}h`, icon: Clock },
                                                { label: 'XP', val: stats.totalChaptersRead * 50, icon: Sparkles },
                                            ].map((stat, i) => (
                                                <div key={i} className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-white/20">
                                                        <stat.icon size={12} />
                                                        <span className="text-[9px] font-black tracking-widest uppercase">{stat.label}</span>
                                                    </div>
                                                    <div className="text-2xl font-black tracking-tighter italic">{stat.val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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

                                    {/* Duolingo style map container */}
                                    <div className="relative h-[600px] overflow-y-auto overflow-x-hidden rounded-3xl bg-black/40 p-4 border border-white/5 scrollbar-hide" id="journey-scroll-container">
                                        
                                        {/* Testament marker - VT */}
                                        <div className="text-center py-8 relative z-20">
                                            <span className="bg-white/10 border border-white/20 px-6 py-2 rounded-full text-xs font-bold tracking-[0.2em] uppercase">Antigo Testamento</span>
                                        </div>

                                        <div className="relative w-full max-w-lg mx-auto" style={{ height: totalBooks * LEVEL_HEIGHT + 200 }}>
                                            {/* Sinuous Path Background */}
                                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0">
                                                {Array.from({ length: totalBooks - 1 }).map((_, i) => {
                                                    // Skip drawing line connecting Malachi to Matthew as it's a new testament break
                                                    if (i === 38) return null;
                                                    
                                                    const start = getLevelPosition(i, 400); // fixed width constraint for path calc
                                                    const end = getLevelPosition(i + 1, 400);
                                                    const node = mapNodes[i+1];
                                                    
                                                    // Path color based on destination node unlock state
                                                    const strokeColor = node.isUnlocked ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)";
                                                    
                                                    return (
                                                        <path
                                                            // Offset Y to account for Testament markers
                                                            key={i}
                                                            d={`M ${start.x} ${start.y + (i >= 39 ? 120 : 0)} C ${start.x} ${start.y + (i >= 39 ? 120 : 0) + 60}, ${end.x} ${end.y + (i + 1 >= 39 ? 120 : 0) - 60}, ${end.x} ${end.y + (i + 1 >= 39 ? 120 : 0)}`}
                                                            stroke={strokeColor}
                                                            strokeWidth="12"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                        />
                                                    );
                                                })}
                                            </svg>

                                            {/* Map Nodes (Books) */}
                                            {mapNodes.map((node) => {
                                                const pos = getLevelPosition(node.index, 400); // Ensure nodes align with SVG
                                                const isNT = node.index >= 39;
                                                const yOffset = isNT ? 120 : 0; // Push down NT nodes to make room for the marker
                                                
                                                return (
                                                    <React.Fragment key={node.abbrev.pt}>
                                                        {node.index === 39 && (
                                                            <div className="absolute w-full text-center z-20" style={{ top: pos.y + yOffset - 100 }}>
                                                                <span className="bg-white/10 border border-white/20 px-6 py-2 rounded-full text-xs font-bold tracking-[0.2em] uppercase">Novo Testamento</span>
                                                            </div>
                                                        )}
                                                        <motion.button
                                                            whileHover={node.isUnlocked ? { scale: 1.15 } : {}}
                                                            whileTap={node.isUnlocked ? { scale: 0.95 } : {}}
                                                            onClick={() => node.isUnlocked && navigate(`/bible/${node.abbrev.pt}`)}
                                                            className={cn(
                                                                "absolute w-[80px] h-[80px] rounded-full flex flex-col items-center justify-center transition-all border-4 z-10 shadow-xl",
                                                                node.isCompleted 
                                                                    ? "bg-amber-400 border-amber-200 text-amber-950 shadow-[0_0_30px_rgba(251,191,36,0.5)]" 
                                                                    : node.isCurrent 
                                                                        ? "bg-white border-white text-black shadow-[0_0_40px_rgba(255,255,255,0.6)] ring-4 ring-white/20 animate-pulse" 
                                                                        : "bg-zinc-900 border-zinc-700 text-zinc-500 cursor-not-allowed"
                                                            )}
                                                            style={{
                                                                left: `calc(50% - 40px + ${pos.x - 200}px)`, // center relative positioning
                                                                top: pos.y + yOffset - 40,
                                                            }}
                                                        >
                                                            {node.isCompleted ? (
                                                                <CheckCircle2 size={32} className="text-amber-900" />
                                                            ) : !node.isUnlocked ? (
                                                                <Lock size={24} className="opacity-50" />
                                                            ) : (
                                                                <span className="font-black text-2xl tracking-tighter leading-none">{node.name.substring(0, 3)}</span>
                                                            )}
                                                            
                                                            {/* Label underneath */}
                                                            <div className="absolute top-[90px] w-[120px] text-center">
                                                                <span className={cn(
                                                                    "text-xs font-bold tracking-tight rounded-md px-2 py-1 bg-black/80 backdrop-blur-sm border",
                                                                    node.isUnlocked ? "text-white border-white/20" : "text-white/30 border-transparent"
                                                                )}>
                                                                    {node.name}
                                                                </span>
                                                            </div>
                                                        </motion.button>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
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
    );
}
