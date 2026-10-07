import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    LoaderCircle,
    BookOpen,
    Users
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';
import { translateAuthError } from '../services/authErrors';
import './auth.css';

export default function Auth() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeProvider, setActiveProvider] = useState<'discord' | 'google' | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const restoreLoginButtons = (event: PageTransitionEvent) => {
            if (event.persisted) setLoading(false);
        };
        window.addEventListener('pageshow', restoreLoginButtons);
        return () => window.removeEventListener('pageshow', restoreLoginButtons);
    }, []);

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const handleOAuthLogin = async (provider: 'discord' | 'google') => {
        setActiveProvider(provider);
        setLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo: new URL('/auth/callback', window.location.origin).toString() },
            });
            if (error) throw error;
        } catch (err: unknown) {
            setError(translateAuthError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.'));
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <Link to="/" className="auth-back"><ArrowLeft size={16} />Voltar ao início</Link>
            <div className="auth-layout">
                <section className="auth-story" aria-label="OneFlow">
                    <div className="auth-logo"><img src={logo} alt="OneFlow" /></div>
                    <p className="auth-eyebrow">UM ESPAÇO PARA A SUA FÉ</p>
                    <h2>Sua jornada.<br /><em>Um novo começo.</em></h2>
                    <p className="auth-story-description">Encontre inspiração na Palavra e pessoas para compartilhar a caminhada.</p>
                    <div className="auth-story-details"><span><BookOpen size={17} /> Palavra que inspira</span><span><Users size={17} /> Conexões com propósito</span></div>
                </section>
                <motion.section className="auth-panel" aria-labelledby="auth-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="auth-eyebrow">BEM-VINDO AO ONEFLOW</p>
                    <h1 id="auth-title">Entre no seu <em>flow.</em></h1>
                    <p className="auth-description">Escolha sua conta para começar ou continuar sua jornada.</p>
                    <div className="auth-providers" aria-busy={loading}>
                        <button type="button" className="auth-provider auth-provider-discord" disabled={loading} onClick={() => handleOAuthLogin('discord')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-discord" viewBox="0 0 16 16">
                                        <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
                                    </svg>
                            <span>{loading && activeProvider === 'discord' ? 'Conectando…' : 'Continuar com Discord'}</span>
                            {loading && activeProvider === 'discord' ? <LoaderCircle className="auth-spinner" size={18} /> : <ArrowRight size={18} />}
                        </button>
                        <div className="auth-divider"><span />ou<span /></div>
                        <button type="button" className="auth-provider auth-provider-google" disabled={loading} onClick={() => handleOAuthLogin('google')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48" >
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                    </svg>
                            <span>{loading && activeProvider === 'google' ? 'Conectando…' : 'Continuar com Google'}</span>
                            {loading && activeProvider === 'google' ? <LoaderCircle className="auth-spinner" size={18} /> : <ArrowRight size={18} />}
                        </button>
                    </div>
                    {error && <div className="auth-error" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}
                    <p className="auth-account-note">Sua conta será criada automaticamente no primeiro acesso.</p>
                    <p className="auth-terms">Ao continuar, você concorda com os <Link to="/terms">Termos de uso</Link> e a <Link to="/privacy">Política de privacidade</Link>.</p>
                </motion.section>
            </div>
            <footer className="auth-footer">Sua fé. Sua jornada. OneFlow.</footer>
        </main>
    );
}
