import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette as PaletteIcon, Image as ImageIcon, Layout as LayoutIcon, Upload, Trash2 } from 'lucide-react';
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

export default function CustomizationModal({ isOpen, onClose }: Props) {
    const { preferences, updatePreference, resetPreferences } = usePreferences();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size limit check (approx 50MB for videos/4K)
        if (file.size > 50 * 1024 * 1024) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            const type = (file.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video';
            const newWallpaper = { type, url };
            
            // Add to gallery
            const currentGallery = preferences.uploadedWallpapers || [];
            updatePreference('uploadedWallpapers', [...currentGallery, newWallpaper]);
            
            // Apply it
            updatePreference('customWallpaper', newWallpaper);
            updatePreference('wallpaper', 'custom');
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteWallpaper = (url: string) => {
        const currentGallery = preferences.uploadedWallpapers || [];
        const newGallery = currentGallery.filter(w => w.url !== url);
        updatePreference('uploadedWallpapers', newGallery);
        
        // If the deleted one was active, revert to default
        if (preferences.customWallpaper?.url === url) {
            updatePreference('customWallpaper', undefined);
            updatePreference('wallpaper', 'particles');
        }
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
                        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-black/40 backdrop-blur-2xl border-l border-white/10 z-50 overflow-y-auto"
                    >
                        <div className="p-6 md:p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold font-serif tracking-tight">Estilo do App</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-10">
                                {/* Upload & Gallery Section */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">Sua Galeria</h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Upload Button */}
                                        <label className="flex flex-col items-center justify-center gap-2 h-24 rounded-2xl bg-white/[0.03] border border-white/10 border-dashed hover:bg-white/10 transition-all cursor-pointer group">
                                            <Upload size={20} className="text-white/40 group-hover:text-white group-hover:scale-110 transition-all" />
                                            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Novo Upload</span>
                                            <input type="file" className="hidden" accept="video/mp4,image/*" onChange={handleFileUpload} />
                                        </label>

                                        {/* User Gallery Items */}
                                        {preferences.uploadedWallpapers?.map((p, idx) => (
                                            <div key={idx} className="relative group h-24">
                                                <button
                                                    onClick={() => {
                                                        updatePreference('customWallpaper', { type: p.type, url: p.url });
                                                        updatePreference('wallpaper', 'custom');
                                                    }}
                                                    className={cn(
                                                        "w-full h-full rounded-2xl overflow-hidden transition-all border-2",
                                                        preferences.wallpaper === 'custom' && preferences.customWallpaper?.url === p.url
                                                            ? "border-white shadow-lg shadow-white/10"
                                                            : "border-transparent opacity-60 hover:opacity-100"
                                                    )}
                                                >
                                                    {p.type === 'video' ? (
                                                        <video src={p.url} className="w-full h-full object-cover" muted />
                                                    ) : (
                                                        <img src={p.url} alt="User Upload" className="w-full h-full object-cover" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteWallpaper(p.url)}
                                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                                    title="Remover da galeria"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {(!preferences.uploadedWallpapers || preferences.uploadedWallpapers.length === 0) && (
                                        <p className="text-[10px] text-white/20 italic text-center py-4 uppercase tracking-widest">
                                            Nenhum upload ainda
                                        </p>
                                    )}
                                </section>

                                {/* Dashboard Style Section */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">Estilo de Navegação</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['cards', 'dock'] as const).map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => updatePreference('dashboardStyle', style)}
                                                className={cn(
                                                    "py-3 px-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all border-2",
                                                    (preferences.dashboardStyle || 'dock') === style
                                                        ? "border-white bg-white/10 text-white shadow-lg shadow-white/5"
                                                        : "border-transparent bg-white/[0.03] text-white/40 hover:bg-white/5 hover:text-white/80"
                                                )}
                                            >
                                                {style === 'cards' ? 'Cards (Grid)' : 'Floating Dock'}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Glass Intensity Section */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">Intensidade do Vidro</h4>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['crystal', 'frosted', 'solid'] as const).map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => updatePreference('glassStyle', style)}
                                                className={cn(
                                                    "py-3 px-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all border-2",
                                                    (preferences.glassStyle || 'frosted') === style
                                                        ? "border-white bg-white/10 text-white shadow-lg shadow-white/5"
                                                        : "border-transparent bg-white/[0.03] text-white/40 hover:bg-white/5 hover:text-white/80"
                                                )}
                                            >
                                                {style === 'crystal' ? 'Cristalino' : style === 'frosted' ? 'Fosco' : 'Sólido'}
                                            </button>
                                        ))}
                                    </div>
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
