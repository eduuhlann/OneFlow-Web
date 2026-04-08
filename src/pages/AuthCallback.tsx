import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function AuthCallback() {
    const navigate = useNavigate();
    const handled = useRef(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const handleCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const errorParam = params.get('error');
            const errorDescription = params.get('error_description');

            // Erro vindo do provider (Google/Supabase)
            if (errorParam) {
                console.error('[AuthCallback] Provider error:', errorParam, errorDescription);
                setErrorMsg(errorDescription || errorParam);
                setTimeout(() => navigate('/auth', { replace: true }), 3000);
                return;
            }

            // PKCE: troca explícita do code por sessão
            if (code) {
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error('[AuthCallback] exchangeCodeForSession error:', error);
                    setErrorMsg(error.message);
                    setTimeout(() => navigate('/auth', { replace: true }), 3000);
                    return;
                }
                if (data.session) {
                    navigate('/dashboard', { replace: true });
                    return;
                }
            }

            // Sem code na URL — verifica se já há sessão ativa (implicit flow / fallback)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/dashboard', { replace: true });
                return;
            }

            // Nada funcionou
            console.warn('[AuthCallback] No code param and no session found.');
            navigate('/auth', { replace: true });
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
            {errorMsg ? (
                <>
                    <p style={{ color: '#ef4444', fontSize: 13, fontFamily: 'sans-serif', textAlign: 'center', maxWidth: 320, padding: '0 16px' }}>
                        {errorMsg}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'sans-serif' }}>
                        Redirecionando...
                    </p>
                </>
            ) : (
                <>
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
                </>
            )}
        </div>
    );
}
