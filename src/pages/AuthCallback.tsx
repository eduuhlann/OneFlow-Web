import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function AuthCallback() {
    const navigate = useNavigate();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        let timeoutId: ReturnType<typeof setTimeout>;

        const handleCallback = async () => {
            // 1) Verifica se já há sessão (caso o Supabase tenha processado antes de montar)
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (existingSession) {
                navigate('/dashboard', { replace: true });
                return;
            }

            // 2) Escuta mudanças de auth — aguarda SIGNED_IN
            //    NÃO redireciona em INITIAL_SESSION (pode vir com session null antes do exchange)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    clearTimeout(timeoutId);
                    subscription.unsubscribe();
                    navigate('/dashboard', { replace: true });
                }
                // Ignora INITIAL_SESSION com null — o Supabase ainda está trocando o code
                // Só redireciona pro auth se houver TOKEN_REFRESHED_ERROR ou similar
            });

            // 3) Timeout de segurança: tenta getSession uma última vez após 6s
            timeoutId = setTimeout(async () => {
                subscription.unsubscribe();
                const { data: { session: fallbackSession } } = await supabase.auth.getSession();
                navigate(fallbackSession ? '/dashboard' : '/auth', { replace: true });
            }, 6000);
        };

        handleCallback();
    }, [navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
        }}>
            <div style={{
                width: 40,
                height: 40,
                border: '3px solid rgba(255,255,255,0.1)',
                borderTop: '3px solid white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 12,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                fontFamily: 'sans-serif',
            }}>
                Autenticando...
            </p>
        </div>
    );
}
