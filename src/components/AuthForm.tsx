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
import { translateAuthError } from '../services/authErrors';

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

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(translateAuthError(err.message));
            setLoading(false);
        }
    };

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
            setError(translateAuthError(err.message));
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

                    {(authMode === 'LOGIN' || authMode === 'REGISTER') && (
                        <>
                            <div className="relative py-4 flex items-center gap-4">
                                <div className="flex-1 h-px bg-white/5" />
                                <span className="text-[10px] font-bold tracking-[0.2em] text-white/10 uppercase">OU</span>
                                <div className="flex-1 h-px bg-white/5" />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full bg-white/[0.04] border border-white/10 text-white py-5 rounded-2xl font-bold text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                                </svg>
                                CONTINUAR COM GOOGLE
                            </button>
                        </>
                    )}

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
