import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    Camera,
    Save,
    User,
    Mail,
    Lock,
    Upload,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { supabase } from '../services/supabase';
import { discordService } from '../services/features/discordService';
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
    
    const [name, setName] = useState(profile?.username || user?.user_metadata?.username || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
    const [previewUrl, setPreviewUrl] = useState(profile?.avatar_url || '');
    const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || '');
    const [bannerPreviewUrl, setBannerPreviewUrl] = useState(profile?.banner_url || '');
    const [discordDecorationUrl, setDiscordDecorationUrl] = useState(profile?.discord_decoration_url || '');
    
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [syncingDiscord, setSyncingDiscord] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Update internal state when profile context changes
    useEffect(() => {
        if (profile) {
            setName(profile.username || '');
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

    const handleSyncDiscord = async () => {
        setSyncingDiscord(true);
        setError('');
        try {
            // No fluxo OAuth2 real, o Supabase já traz os metadados
            // Se o login foi feito com Discord, os dados estão no user_metadata
            const discordMetadata = user?.user_metadata;
            
            if (user?.app_metadata?.provider !== 'discord') {
                setError('Para sincronizar molduras automaticamente, você precisa entrar com o Discord.');
                return;
            }

            // Para pegar a moldura (decoration), precisamos do token de acesso do provedor
            // O Supabase armazena isso na sessão se habilitado
            const { data: { session } } = await supabase.auth.getSession();
            const providerToken = session?.provider_token;

            if (providerToken) {
                const discordData = await discordService.getUserData(providerToken);
                if (discordData.avatar_decoration_data) {
                    const decorationUrl = discordService.getDecorationUrl(discordData.avatar_decoration_data.asset);
                    setDiscordDecorationUrl(decorationUrl);
                }
                
                // Sync avatar
                if (discordData.avatar) {
                    const cdnAvatar = `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png?size=512`;
                    setAvatarUrl(cdnAvatar);
                    setPreviewUrl(cdnAvatar);
                }
                
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                // Fallback para metadados básicos se o token não estiver disponível
                if (discordMetadata?.avatar_url) {
                    setAvatarUrl(discordMetadata.avatar_url);
                    setPreviewUrl(discordMetadata.avatar_url);
                }
                setError('Sessão do Discord expirada. Tente sair e entrar novamente com Discord.');
            }
        } catch (err: any) {
            setError('Falha ao sincronizar. Certifique-se de que o provedor Discord está configurado no Supabase.');
        } finally {
            setSyncingDiscord(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess(false);
        try {
            await updateProfile({ 
                username: name, 
                bio, 
                avatar_url: avatarUrl || null,
                banner_url: bannerUrl || null,
                discord_decoration_url: discordDecorationUrl || null
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar perfil.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageTransition>
        <div className="min-h-screen bg-[#0f0f10] text-white overflow-x-hidden font-sans">
            <div className="max-w-[800px] mx-auto p-4 md:p-8 mb-20">
                <header className="flex items-center gap-6 mb-12 text-white/40">
                    <button onClick={() => navigate('/settings')} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-white">Editar Perfil</h1>
                </header>

                <div className="bg-[#1e1f22] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                    {/* Banner Section */}
                    <div className="relative group/banner">
                        <input
                            ref={bannerInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,.gif"
                            onChange={(e) => handleFileChange(e, 'banner')}
                        />
                        <div 
                            className="w-full aspect-[2.5/1] bg-black relative cursor-pointer overflow-hidden transition-all"
                            onClick={() => bannerInputRef.current?.click()}
                        >
                            {bannerPreviewUrl ? (
                                <img src={bannerPreviewUrl} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#111214] flex items-center justify-center text-white/5">
                                    <Upload size={32} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <Camera size={24} className="text-white drop-shadow-lg" />
                            </div>
                        </div>

                        {/* Avatar Overlay - Circular Discord Style with Decoration */}
                        <div className="absolute -bottom-16 left-6 z-10">
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*,.gif"
                                onChange={(e) => handleFileChange(e, 'avatar')}
                            />
                            <div className="relative">
                                <div 
                                    className="w-32 h-32 rounded-full bg-[#1e1f22] p-[6px] cursor-pointer group/avatar relative"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {/* Avatar Decoration Overlay */}
                                    {discordDecorationUrl && (
                                        <div className="absolute inset-[-15%] pointer-events-none z-20">
                                            <img src={discordDecorationUrl} alt="Decoration" className="w-full h-full object-contain" />
                                        </div>
                                    )}

                                    <div className="w-full h-full rounded-full bg-[#2b2d31] overflow-hidden relative border border-white/5">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={48} className="text-white/10 m-auto mt-7" />
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Branding Header */}
                    <div className="pt-20 px-6 pb-6 border-b border-white/5">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {name || user?.user_metadata?.username || user?.email?.split('@')[0]}
                                </h2>
                                <p className="text-white/30 text-xs mt-1 font-medium">
                                    {user?.app_metadata?.provider === 'discord' ? 'Vinculado ao Discord' : 'Sincronizado via OneFlow Identity'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSyncDiscord}
                                    disabled={syncingDiscord}
                                    className="px-4 py-2.5 bg-[#5865f2]/10 hover:bg-[#5865f2]/20 text-[#5865f2] rounded-md font-bold text-[13px] transition-all flex items-center gap-2 border border-[#5865f2]/20 shadow-lg shadow-[#5865f2]/5"
                                >
                                    <Zap size={16} className={cn(syncingDiscord && "animate-pulse")} />
                                    {syncingDiscord ? 'Sincronizando...' : 'Sincronizar Discord'}
                                </button>
                                
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || uploading}
                                    className="px-6 py-2.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md font-bold text-[13px] transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#5865f2]/10"
                                >
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Info Card */}
                    <div className="p-6 space-y-8 bg-[#18191c]">
                        {/* Feedback Messages */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3 text-xs font-bold">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 flex items-center gap-3 text-xs font-bold">
                                <CheckCircle2 size={16} /> Sucesso!
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black tracking-wider text-white/40 uppercase">Nome de Exibição</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#111214] border border-transparent focus:border-[#5865f2] rounded-lg py-3 px-4 focus:outline-none transition-all font-medium text-sm"
                                    placeholder="Seu nome"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black tracking-wider text-white/40 uppercase">Sobre Mim</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full bg-[#111214] border border-transparent focus:border-[#5865f2] rounded-lg py-3 px-4 focus:outline-none transition-all font-medium text-sm resize-none"
                                    placeholder="Conte um pouco sobre você..."
                                    rows={4}
                                />
                            </div>

                            {/* Options to clear decoration */}
                            {discordDecorationUrl && (
                                <button 
                                    onClick={() => setDiscordDecorationUrl('')}
                                    className="text-[10px] text-red-400/60 hover:text-red-400 font-bold uppercase tracking-widest"
                                >
                                    Remover Moldura do Discord
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {user?.app_metadata?.provider !== 'discord' && (
                    <div className="mt-8 p-6 bg-[#5865f2]/5 border border-[#5865f2]/10 rounded-2xl flex items-center justify-between gap-6">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-white/80">Quer usar suas molduras do Discord?</p>
                            <p className="text-xs text-white/40">Saia e entre novamente usando a opção "Continuar com Discord".</p>
                        </div>
                        <button 
                            onClick={() => navigate('/auth')}
                            className="px-4 py-2 bg-[#5865f2] text-white text-[11px] font-black uppercase tracking-wider rounded-lg"
                        >
                            Ir para Login
                        </button>
                    </div>
                )}
            </div>
        </div>
        </PageTransition>
    );
};

export default Profile;
