import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function AuthCallback() {
    const navigate = useNavigate();
    const handled = useRef(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const cleanCallbackUrl = () => {
            const url = new URL(window.location.href);
            url.search = '';
            url.hash = '';
            window.history.replaceState({}, document.title, url.toString());
        };

        const redirectIfAuthenticated = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            if (!data.session) return false;

            cleanCallbackUrl();
            window.location.replace('http://localhost:3000/dashboard');
            return true;
        };

        const handleCallback = async () => {
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
                const code = searchParams.get('code') || hashParams.get('code');
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const errorCode = searchParams.get('error') || hashParams.get('error');
                const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

                if (errorCode) {
                    throw new Error(errorDescription || errorCode);
                }

                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;
                } else if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) throw error;
                }

                if (await redirectIfAuthenticated()) return;

                throw new Error('A sessão do Discord não foi concluída. Tente novamente.');
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Não foi possível concluir o login.';
                console.error('[AuthCallback]', error);
                setErrorMsg(message);
                window.setTimeout(() => navigate('/auth', { replace: true }), 3000);
            }
        };

        void handleCallback();
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
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'sans-serif' }}>
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
                        color: 'rgba(255,255,255,0.75)',
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
