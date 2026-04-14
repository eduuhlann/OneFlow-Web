import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft,
    Camera,
    Save,
    User,
    Upload,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { MfaVerificationModal } from '../components/MfaVerificationModal';
import { supabase } from '../services/supabase';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import PageTransition from '../components/PageTransition';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile, updateProfile } = useProfile();
    
    const [displayName, setDisplayName] = useState(profile?.display_name || profile?.username || user?.user_metadata?.username || '');
    const [username, setUsername] = useState(profile?.username || user?.user_metadata?.username || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
    const [previewUrl, setPreviewUrl] = useState(profile?.avatar_url || '');
    const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || '');
    const [bannerPreviewUrl, setBannerPreviewUrl] = useState(profile?.banner_url || '');
    const [discordDecorationUrl, setDiscordDecorationUrl] = useState(profile?.discord_decoration_url || '');
    
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [fetchError, setFetchError] = useState<string | undefined>(undefined);
    const [success, setSuccess] = useState(false);
    const [showSaveWarning, setShowSaveWarning] = useState(false);
    const [showMfaModal, setShowMfaModal] = useState(false);
    const [pendingUpdates, setPendingUpdates] = useState<any>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Update internal state when profile context changes
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || profile.username || '');
            setUsername(profile.username || '');
            setBio(profile.bio || '');
            setAvatarUrl(profile.avatar_url || '');
            setPreviewUrl(profile.avatar_url || '');
            setBannerUrl(profile.banner_url || '');
            setBannerPreviewUrl(profile.banner_url || '');
            setDiscordDecorationUrl(profile.discord_decoration_url || '');
        }
    }, [profile]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 20 * 1024 * 1024) {
            setError('Arquivo muito grande. Máximo 20MB.');
            return;
        }

        setError('');
        setUploading(true);

        try {
            const ext = file.name.split('.').pop();
            const filePath = `${user.id}/${type}.${ext}`;
            const bucket = type === 'avatar' ? 'avatars' : 'banners';

            const { error: uploadErr } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, { upsert: true });

            if (uploadErr) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;
                    if (type === 'avatar') {
                        setAvatarUrl(dataUrl);
                        setPreviewUrl(dataUrl);
                    } else {
                        setBannerUrl(dataUrl);
                        setBannerPreviewUrl(dataUrl);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
                const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
                if (type === 'avatar') {
                    setAvatarUrl(publicUrl);
                    setPreviewUrl(publicUrl);
                } else {
                    setBannerUrl(publicUrl);
                    setBannerPreviewUrl(publicUrl);
                }
            }
        } catch {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                if (type === 'avatar') {
                    setAvatarUrl(dataUrl);
                    setPreviewUrl(dataUrl);
                } else {
                    setBannerUrl(dataUrl);
                    setBannerPreviewUrl(dataUrl);
                }
            };
            reader.readAsDataURL(file);
        } finally {
            setUploading(false);
        }
    };


    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess(false);
        try {
            const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
            
            // 1. Check if username changed and if it is unique
            if (cleanUsername !== profile?.username) {
                const { data: existingUser, error: checkError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('username', cleanUsername)
                    .single();

                if (existingUser && existingUser.id !== user?.id) {
                    setError('Este nome de usuário já está em uso.');
                    setIsSaving(false);
                    return;
                }
                
                if (checkError && checkError.code !== 'PGRST116') {
                    throw checkError;
                }

                // 2. Trigger MFA Modal for username change
                setPendingUpdates({
                    display_name: displayName,
                    username: cleanUsername, 
                    bio, 
                    avatar_url: avatarUrl || null,
                    banner_url: bannerUrl || null,
                    discord_decoration_url: discordDecorationUrl || null
                });
                setShowMfaModal(true);
                setIsSaving(false);
                return;
            }

            // Normal update if username didn't change
            await updateProfile({ 
                display_name: displayName,
                username: cleanUsername, 
                bio, 
                avatar_url: avatarUrl || null,
                banner_url: bannerUrl || null,
                discord_decoration_url: discordDecorationUrl || null
            });
            setShowSaveWarning(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar perfil.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleMfaVerified = async () => {
        if (!pendingUpdates) return;
        setIsSaving(true);
        setShowMfaModal(false);
        try {
            await updateProfile(pendingUpdates);
            setSuccess(true);
            setPendingUpdates(null);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar perfil após MFA.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageTransition>
        <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-white/20">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none opacity-20 hidden md:block">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500 blur-[150px]" />
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-8 md:pt-12 mb-20 relative z-10">
                <header className="flex items-center gap-6 mb-10">
                    <button 
                        onClick={() => navigate('/settings')} 
                        className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all text-white/50 hover:text-white"
                    >
                        <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase mb-1 block">Ajustes OneFlow</span>
                        <h1 className="text-3xl sm:text-4xl font-serif font-black italic -rotate-1 tracking-tighter">Editar Perfil</h1>
                    </div>
                </header>

                <div className="bg-white/[0.02] backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative">
                    
                    {/* Banner Section */}
                    <div className="relative group/banner z-10">
                        <input
                            ref={bannerInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,.gif"
                            onChange={(e) => handleFileChange(e, 'banner')}
                        />
                        <div 
                            className="w-full h-48 md:h-64 relative cursor-pointer overflow-hidden transition-all bg-black/40"
                            onClick={() => bannerInputRef.current?.click()}
                            style={bannerPreviewUrl && bannerPreviewUrl.startsWith('#') ? { backgroundColor: bannerPreviewUrl } : {}}
                        >
                            {bannerPreviewUrl && !bannerPreviewUrl.startsWith('#') ? (
                                <img src={bannerPreviewUrl} alt="Banner" className="w-full h-full object-cover" />
                            ) : !bannerPreviewUrl && (
                                <div className="w-full h-full flex flex-col items-center justify-center text-white/20 bg-gradient-to-br from-white/[0.05] to-transparent">
                                    <Upload size={32} className="mb-2" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Adicionar Banner</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-all flex flex-col items-center justify-center backdrop-blur-sm">
                                <Camera size={28} className="text-white mb-2" />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white">Alterar Banner</span>
                            </div>
                            {/* Inner shadow for smooth blending */}
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
                        </div>

                        {/* Avatar Overlay */}
                        <div className="absolute -bottom-16 left-8 z-20">
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*,.gif"
                                onChange={(e) => handleFileChange(e, 'avatar')}
                            />
                            <div className="relative group/avatar">
                                <div 
                                    className="w-36 h-36 rounded-full bg-[#0a0a0a] p-2 cursor-pointer relative z-10"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="w-full h-full rounded-full bg-white/5 overflow-hidden relative border border-white/10 group-hover/avatar:border-white/30 transition-colors">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={48} className="text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-all flex flex-col items-center justify-center backdrop-blur-sm pb-1">
                                            <Camera size={24} className="text-white mb-1" />
                                        </div>
                                    </div>
                                    {discordDecorationUrl && (
                                        <div className="absolute inset-[-18.5%] w-[137%] h-[137%] pointer-events-none z-20">
                                            <img 
                                                src={discordDecorationUrl} 
                                                alt="Decoração" 
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Header actions */}
                    <div className="pt-20 px-8 pb-8 flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/5 relative z-10">
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-black tracking-tighter">
                                {displayName || username || user?.email?.split('@')[0]}
                            </h2>
                            <p className="text-white/40 text-sm mt-1 font-bold lowercase tracking-wide flex items-center gap-1">
                                {username || 'usuario'}
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={isSaving || uploading}
                                className="px-8 py-3.5 bg-white text-black hover:bg-white/90 rounded-2xl font-black text-xs tracking-[0.1em] uppercase transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                Salvar Perfil
                            </motion.button>
                            <AnimatePresence>
                                {showSaveWarning && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: -5, filter: 'blur(4px)' }} 
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, y: -5, filter: 'blur(4px)' }}
                                        className="text-[10px] text-white/50 font-bold uppercase tracking-widest"
                                    >
                                        Dados sincronizados! Clique em salvar.
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="p-8 space-y-8 relative z-10">
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-center gap-3 text-sm font-medium mb-8">
                                        <AlertCircle size={18} /> {error}
                                    </div>
                                </motion.div>
                            )}
                            {success && !showSaveWarning && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 flex items-center gap-3 text-sm font-medium mb-8">
                                        <CheckCircle2 size={18} /> Sucesso! Alterações salvas.
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase ml-1 block">
                                        Nome de Exibição
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-2xl py-4 px-5 focus:outline-none transition-all text-white placeholder:text-white/10 font-bold text-sm shadow-inner"
                                            placeholder="Como você quer ser chamado"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase ml-1 block">
                                        Username
                                    </label>
                                    <div className="relative group flex items-center">
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                            className="w-full bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-2xl py-4 px-5 focus:outline-none transition-all text-white placeholder:text-white/10 font-bold text-sm shadow-inner lowercase"
                                            placeholder="seu_id_unico"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between ml-1 mb-1">
                                    <label className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">
                                        Sobre Mim
                                    </label>
                                    <span className="text-[10px] font-bold text-white/20">
                                        {bio.length}/160
                                    </span>
                                </div>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value.slice(0, 160))}
                                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/10 rounded-2xl py-4 px-5 focus:outline-none transition-all text-white placeholder:text-white/10 font-medium text-sm resize-none shadow-inner leading-relaxed min-h-[120px]"
                                    placeholder="Escreva algo sobre você..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <MfaVerificationModal 
                isOpen={showMfaModal}
                onClose={() => setShowMfaModal(false)}
                onVerified={handleMfaVerified}
            />
        </div>
        </PageTransition>
    );
};

export default Profile;

