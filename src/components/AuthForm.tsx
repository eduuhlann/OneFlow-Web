import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    User,
    ArrowRight,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'VERIFY_CODE';

export default function AuthForm({ onSuccess }: { onSuccess?: () => void } = {}) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, navigate, onSuccess]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (authMode === 'LOGIN') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else if (authMode === 'REGISTER') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username },
                    },
                });
                if (error) throw error;

                if (data.user) {
                    // Initialize profile
                    await supabase.from('profiles').upsert({
                        id: data.user.id,
                        username: username,
                        avatar_id: 'lion',
                        total_xp: 0,
                        completed_lessons: 0,
                    });

                    if (!data.session) {
                        setMessage('Verifique seu e-mail para confirmar seu cadastro.');
                        setAuthMode('LOGIN');
                    }
                }
            } else if (authMode === 'FORGOT_PASSWORD') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) throw error;
                setMessage('E-mail de recuperação enviado!');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto relative z-10">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-left">
                <div className="flex bg-black/50 p-1 rounded-2xl mb-8 border border-white/5">
                    <button
                        onClick={() => setAuthMode('LOGIN')}
                        className={`flex-1 py-3 text-[10px] font-bold tracking-[0.2em] rounded-xl transition-all ${authMode === 'LOGIN' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                    >
                        LOGIN
                    </button>
                    <button
                        onClick={() => setAuthMode('REGISTER')}
                        className={`flex-1 py-3 text-[10px] font-bold tracking-[0.2em] rounded-xl transition-all ${authMode === 'REGISTER' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                    >
                        CADASTRO
                    </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <AnimatePresence mode="wait">
                        {authMode === 'REGISTER' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                            >
                                <label className="text-[10px] font-bold tracking-[0.2em] text-white/40 ml-4">USERNAME</label>
                                <div className="relative group">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={20} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="seu_nome"
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-white/30 transition-all text-white placeholder:text-white/10"
                                        required
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-white/40 ml-4">E-MAIL</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="exemplo@email.com"
                                className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-white/30 transition-all text-white placeholder:text-white/10"
                                required
                            />
                        </div>
                    </div>

                    {authMode !== 'FORGOT_PASSWORD' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-[0.2em] text-white/40 ml-4">SENHA</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-14 pr-14 focus:outline-none focus:border-white/30 transition-all text-white placeholder:text-white/10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-xs font-bold">
                            <CheckCircle2 size={18} />
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? 'PROCESSANDO...' : (
                            <>
                                {authMode === 'LOGIN' ? 'ENTRAR AGORA' : authMode === 'REGISTER' ? 'CRIAR CONTA' : 'RECUPERAR'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {authMode === 'LOGIN' && (
                        <button
                            type="button"
                            onClick={() => setAuthMode('FORGOT_PASSWORD')}
                            className="w-full text-[10px] font-bold tracking-[0.2em] text-white/20 hover:text-white transition-colors uppercase py-2"
                        >
                            Esqueceu a senha?
                        </button>
                    )}

                    {authMode === 'FORGOT_PASSWORD' && (
                        <button
                            type="button"
                            onClick={() => setAuthMode('LOGIN')}
                            className="w-full text-[10px] font-bold tracking-[0.2em] text-white/20 hover:text-white transition-colors uppercase py-2"
                        >
                            Voltar para Login
                        </button>
                    )}
                </form>
            </div>

            <p className="mt-12 text-center text-[9px] font-bold tracking-[0.4em] text-white/10 leading-relaxed uppercase">
                AO CONTINUAR VOCÊ CONCORDA COM OS<br />
                <span className="text-white/30 underline">TERMOS E PRIVACIDADE</span>
            </p>
        </div>
    );
}
