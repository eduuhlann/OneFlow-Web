import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    Camera,
    Save,
    User,
    Mail,
    Clock,
    Sparkles,
    Lock,
    ChevronRight,
    Upload,
    AlertCircle,
    CheckCircle2,
    MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { supabase } from '../services/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            const filePath = `${user.id}/avatar.${ext}`;

            const { error: uploadErr } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadErr) {
                // Fallback: convert to base64
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;
                    setAvatarUrl(dataUrl);
                    setPreviewUrl(dataUrl);
                };
                reader.readAsDataURL(file);
            } else {
                const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
                setAvatarUrl(publicUrl);
                setPreviewUrl(publicUrl);
            }
        } catch {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                setAvatarUrl(dataUrl);
                setPreviewUrl(dataUrl);
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
            await updateProfile({ username: name, bio, avatar_url: avatarUrl || null });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar perfil.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 overflow-x-hidden">
            <div className="max-w-3xl mx-auto">
                <header className="flex items-center justify-between mb-16">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/settings')} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase">Identidade OneFlow</span>
                            <h1 className="text-4xl font-black italic -rotate-1 tracking-tighter">Perfil</h1>
                        </div>
                    </div>
                </header>

                <div className="space-y-12 pb-24">
                    {/* Feedback Messages */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 flex items-center gap-3 text-sm font-bold">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-white/10 border border-white/20 rounded-2xl text-white flex items-center gap-3 text-sm font-bold">
                            <CheckCircle2 size={18} /> Perfil atualizado com sucesso!
                        </div>
                    )}

                    {/* Avatar Selection */}
                    <div className="flex flex-col items-center">
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,.gif"
                            onChange={handleFileChange}
                        />
                        <div className="relative group">
                            <div className="w-48 h-48 rounded-[3rem] bg-white/10 p-1">
                                <div className="w-full h-full rounded-[2.8rem] bg-black flex items-center justify-center overflow-hidden">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={80} className="text-white/20" />
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-4 right-4 p-4 bg-white text-black rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                        <p className="mt-8 text-white/30 text-[10px] font-black tracking-[0.3em] uppercase italic">PNG, JPG ou GIF animados (máx 20MB)</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black tracking-widest text-white/30 uppercase flex items-center gap-2">
                                    <User size={12} /> NOME COMPLETO
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Como quer ser chamado?"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-8 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all font-bold text-xl tracking-tight"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black tracking-widest text-white/30 uppercase flex items-center gap-2">
                                    <Mail size={12} /> E-MAIL
                                </label>
                                <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 px-8 font-bold text-white/40 flex items-center justify-between cursor-not-allowed">
                                    {user?.email}
                                    <Lock size={14} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black tracking-widest text-white/30 uppercase flex items-center gap-2">
                                    <MessageSquare size={12} /> BIO
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Uma frase sobre você..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-8 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all font-medium text-lg tracking-tight resize-none"
                                />
                            </div>

                            <div className="space-y-4 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || uploading}
                                    className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xs tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : <Save size={18} />}
                                    {isSaving ? 'SALVANDO ALTERAÇÕES...' : 'SALVAR ALTERAÇÕES NO PERFIL'}
                                </button>
                            </div>
                        </div>

                        {/* Integration/Metadata Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] flex items-center gap-6 group">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold tracking-[0.3em] text-white/20 uppercase block mb-1">Status da Conta</span>
                                    <h5 className="font-black italic tracking-tighter">Premium OneFlow</h5>
                                </div>
                            </div>

                            <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] flex items-center gap-6 group">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold tracking-[0.3em] text-white/20 uppercase block mb-1">Membro desde</span>
                                    <h5 className="font-black italic tracking-tighter">
                                        {new Date(user?.created_at || Date.now()).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
