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
    Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import ParticleBackground from '../components/ParticleBackground';
import { statsService } from '../services/features/statsService';
import { STATIC_BOOKS } from '../services/bible/staticBibleData';
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
    const [stats, setStats] = useState(statsService.getStats());

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
        const centerX = width / 2;
        const xOffset = Math.sin(index * 0.8) * (width > 600 ? 100 : 60);
        return { x: centerX + xOffset, y: index * LEVEL_HEIGHT + 60 };
    };

    const totalChapters = selectedBook.chapters;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 overflow-x-hidden font-sans selection:bg-white selection:text-black relative">
            <ParticleBackground />
            <div className="max-w-7xl mx-auto relative z-10">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div className="flex items-center gap-6">
                        <img src={logo} alt="OneFlow" className="w-24 md:w-28 h-auto object-contain" />
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase">Bem-vindo</span>
                            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter">
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
                            className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Nav Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
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
                            <p className="text-white/30 text-xs font-light leading-relaxed">{item.description}</p>
                            <div className="mt-5 flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] text-white/20 group-hover:text-white transition-colors uppercase">
                                Acessar <ChevronRight size={10} />
                            </div>
                        </motion.button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Stats + Journey */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Stats */}
                        <div className="p-8 bg-white/[0.04] border border-white/10 rounded-[2.5rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 text-white/[0.02] pointer-events-none">
                                <TrendingUp size={180} />
                            </div>
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase mb-3 block">Progresso Bíblico</span>
                                <div className="flex items-end gap-3 mb-10">
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
                                            <div className="text-2xl font-black tracking-tighter">{stat.val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Spiral Chapter Journey */}
                        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <span className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase mb-1 block">Jornada Atual</span>
                                    <h3 className="text-2xl font-bold tracking-tight">{selectedBook.name}</h3>
                                </div>
                                <button
                                    onClick={() => navigate(`/bible/${selectedBook.abbrev.pt}`)}
                                    className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all text-xs tracking-widest"
                                >
                                    ALTERAR
                                </button>
                            </div>

                            <div className="relative h-[400px] overflow-y-auto rounded-2xl bg-black/30 p-4">
                                <div className="relative" style={{ height: totalChapters * LEVEL_HEIGHT }}>
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
                                        {Array.from({ length: totalChapters - 1 }).map((_, i) => {
                                            const start = getLevelPosition(i, 600);
                                            const end = getLevelPosition(i + 1, 600);
                                            return (
                                                <path
                                                    key={i}
                                                    d={`M ${start.x} ${start.y} C ${start.x} ${start.y + 60}, ${end.x} ${end.y - 60}, ${end.x} ${end.y}`}
                                                    stroke="white"
                                                    strokeWidth="2"
                                                    fill="none"
                                                    strokeDasharray="5,5"
                                                />
                                            );
                                        })}
                                    </svg>

                                    {Array.from({ length: totalChapters }).map((_, i) => {
                                        const chNum = i + 1;
                                        const isRead = statsService.isChapterRead(selectedBook.abbrev.pt, chNum);
                                        const pos = getLevelPosition(i, 600);
                                        const isLocked = i > 0 && !statsService.isChapterRead(selectedBook.abbrev.pt, i);
                                        const isCurrent = !isRead && !isLocked;

                                        return (
                                            <motion.button
                                                key={i}
                                                whileHover={!isLocked ? { scale: 1.1 } : {}}
                                                onClick={() => navigate(`/bible/${selectedBook.abbrev.pt}/${chNum}`)}
                                                className={cn(
                                                    "absolute w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2 z-10",
                                                    isRead ? "bg-white text-black border-white" :
                                                        isCurrent ? "bg-white/20 border-white/60 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" :
                                                            "bg-white/5 border-white/10 text-white/20"
                                                )}
                                                style={{
                                                    left: pos.x - 28,
                                                    top: pos.y - 28,
                                                }}
                                            >
                                                {isRead ? <CheckCircle2 size={20} /> :
                                                    isLocked ? <Lock size={16} /> :
                                                        <span className="font-black text-lg">{chNum}</span>}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">

                        {/* Próximo plano - monochrome */}
                        <div className="p-8 bg-white/[0.04] border border-white/10 rounded-[2.5rem] text-white">
                            <div className="flex items-center gap-2 mb-5 opacity-40">
                                <Heart size={16} />
                                <span className="text-[10px] font-black tracking-widest uppercase">Próximo Plano</span>
                            </div>
                            <h4 className="text-xl font-bold mb-3 tracking-tight">Renovo Espiritual</h4>
                            <p className="text-sm text-white/40 mb-8 leading-relaxed">Continue sua jornada de 21 dias para renovar sua mente e coração.</p>
                            <button
                                onClick={() => navigate('/plans')}
                                className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                CONTINUAR <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
