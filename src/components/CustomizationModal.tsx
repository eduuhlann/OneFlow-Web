import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette, Image as ImageIcon, Layout as LayoutIcon } from 'lucide-react';
import { usePreferences, ThemeType, WallpaperType, DashboardLayoutItem } from '../contexts/PreferencesContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const themeOptions: { id: ThemeType; label: string; color: string }[] = [
    { id: 'classic-dark', label: 'Clássico', color: 'bg-white' },
    { id: 'royal-purple', label: 'Real', color: 'bg-purple-500' },
    { id: 'midnight-blue', label: 'Meia-noite', color: 'bg-blue-500' },
    { id: 'pure-monochrome', label: 'Puro', color: 'bg-gray-400' }
];

const wallpaperOptions: { id: WallpaperType; label: string; src?: string }[] = [
    { id: 'particles', label: 'Partículas' },
    { id: 'mesh', label: 'Aura' },
    { id: 'aurora', label: 'Boreal' },
    { id: 'none', label: 'Sólido' }
];

const layoutLabels: Record<DashboardLayoutItem, string> = {
    nav: 'Atalhos',
    stats: 'Estatísticas',
    journey: 'Jornada'
};

export default function CustomizationModal({ isOpen, onClose }: Props) {
    const { preferences, updatePreference, resetPreferences } = usePreferences();

    const handleLayoutMove = (index: number, direction: -1 | 1) => {
        if (index + direction < 0 || index + direction >= preferences.dashboardLayout.length) return;
        const newLayout = [...preferences.dashboardLayout];
        const temp = newLayout[index];
        newLayout[index] = newLayout[index + direction];
        newLayout[index + direction] = temp;
        updatePreference('dashboardLayout', newLayout);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-white/10 z-50 overflow-y-auto"
                    >
                        <div className="p-6 md:p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold font-serif tracking-tight">Estilo do App</h2>
                                    <p className="text-white/40 text-sm italic font-serif mt-1">Sua experiência, sua visão.</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-10">
                                {/* Theme Selection */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4 text-white/60">
                                        <Palette size={16} />
                                        <h3 className="text-xs font-bold tracking-[0.2em] uppercase">Tonalidade</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {themeOptions.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => updatePreference('theme', t.id)}
                                                className={cn(
                                                    "p-4 rounded-2xl flex items-center gap-3 transition-all border",
                                                    preferences.theme === t.id
                                                        ? "bg-white/10 border-white/30"
                                                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                                )}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full", t.color)} />
                                                <span className="text-sm font-serif">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Wallpaper Selection */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4 text-white/60">
                                        <ImageIcon size={16} />
                                        <h3 className="text-xs font-bold tracking-[0.2em] uppercase">Fundo Dinâmico</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {wallpaperOptions.map((w) => (
                                            <button
                                                key={w.id}
                                                onClick={() => updatePreference('wallpaper', w.id)}
                                                className={cn(
                                                    "p-4 rounded-2xl text-left transition-all border",
                                                    preferences.wallpaper === w.id
                                                        ? "bg-white/10 border-white/30"
                                                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                                )}
                                            >
                                                <span className="text-sm font-serif block">{w.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Dashboard Layout Order */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4 text-white/60">
                                        <LayoutIcon size={16} />
                                        <h3 className="text-xs font-bold tracking-[0.2em] uppercase">Ordem do Painel</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {preferences.dashboardLayout.map((item, index) => (
                                            <div
                                                key={item}
                                                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group"
                                            >
                                                <span className="font-serif text-sm text-white/80">{layoutLabels[item]}</span>
                                                <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleLayoutMove(index, -1)}
                                                        disabled={index === 0}
                                                        className="p-1 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        onClick={() => handleLayoutMove(index, 1)}
                                                        disabled={index === preferences.dashboardLayout.length - 1}
                                                        className="p-1 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                                                    >
                                                        ↓
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-white/30 text-xs mt-3 italic text-center">
                                        (Mova para definir o que aparece primeiro ao abrir o App)
                                    </p>
                                </section>

                                {/* Reset */}
                                <div className="pt-6 border-t border-white/10">
                                    <button
                                        onClick={resetPreferences}
                                        className="w-full p-4 rounded-2xl text-xs font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Restaurar Padrões
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
