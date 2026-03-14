import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Save, Upload, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { translateAuthError } from '../services/authErrors';

interface ProfileEditModalProps {
    onClose: () => void;
}

export default function ProfileEditModal({ onClose }: ProfileEditModalProps) {
    const { profile, updateProfile } = useProfile();
    const { user } = useAuth();
    const [username, setUsername] = useState(profile?.username ?? '');
    const [bio, setBio] = useState(profile?.bio ?? '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
    const [previewUrl, setPreviewUrl] = useState(profile?.avatar_url ?? '');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
            await updateProfile({ username, avatar_url: avatarUrl || null, bio });
            setSuccess(true);
            setTimeout(() => onClose(), 1200);
        } catch (err: any) {
            setError(translateAuthError(err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
                <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">
                    <X size={22} />
                </button>

                <h2 className="text-2xl font-serif font-bold mb-8 tracking-tight">Editar Perfil</h2>

                {/* Avatar Preview */}
                <div className="flex justify-center mb-6">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 flex items-center justify-center cursor-pointer group"
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => setPreviewUrl('')} />
                        ) : (
                            <User size={40} className="text-white/30" />
                        )}
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {uploading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Upload size={18} className="text-white mb-1" />
                                    <span className="text-[9px] text-white font-bold uppercase tracking-wider">Alterar</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                    {/* File picker */}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,.gif"
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full py-4 bg-white/5 border border-white/10 border-dashed rounded-2xl text-white/40 hover:text-white hover:border-white/30 transition-all text-xs font-bold tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Upload size={16} />
                            {uploading ? 'ENVIANDO...' : 'ESCOLHER ARQUIVO (PNG, JPG, GIF)'}
                        </button>
                        <p className="text-[10px] text-white/20 text-center mt-2">Máximo 20MB · GIFs animados suportados</p>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-white/40 ml-1">USERNAME</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="seu_nome"
                            className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 px-5 focus:outline-none focus:border-white/30 transition-all text-white placeholder:text-white/10 text-sm"
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-white/40 ml-1">BIO</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Uma frase sobre você..."
                            rows={2}
                            className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 px-5 focus:outline-none focus:border-white/30 transition-all text-white placeholder:text-white/10 text-sm resize-none"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs">
                            <CheckCircle2 size={16} /> Perfil salvo!
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? 'SALVANDO...' : <><Save size={16} /> SALVAR PERFIL</>}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}
