import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function AuthCallback() {
    const authentication = useRef<Promise<void> | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        let active = true;

        const cleanCallbackUrl = () => {
            const url = new URL(window.location.href);
            url.search = '';
            url.hash = '';
            window.history.replaceState({}, document.title, url.toString());
        };

        // Reuse the same exchange when StrictMode replays the effect: PKCE codes are single-use.
        if (!authentication.current) {
            authentication.current = (async () => {
                const searchParams = new URLSearchParams(window.location.search);
                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
                const code = searchParams.get('code') || hashParams.get('code');
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const errorCode = searchParams.get('error') || hashParams.get('error');
                const errorReason = searchParams.get('error_code') || hashParams.get('error_code');
                const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

                if (errorCode) {
                    if (errorCode === 'access_denied') throw new Error('Login cancelado. Você pode tentar novamente.');
                    if (errorReason === 'bad_oauth_state') throw new Error('Não foi possível validar esta tentativa. Feche a aba antiga de autorização e inicie um novo login neste navegador.');
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

                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;
                if (!data.session) throw new Error('O login não foi concluído. Inicie uma nova tentativa neste navegador.');
            })();
        }

        const timeout = window.setTimeout(() => {
            if (active) setErrorMsg('O login está demorando para responder. Você pode voltar e tentar novamente.');
        }, 20000);

        void authentication.current.then(() => {
            if (!active) return;
            window.clearTimeout(timeout);
            cleanCallbackUrl();
            window.location.replace(new URL('/dashboard', window.location.origin).toString());
        }).catch((error: unknown) => {
            if (!active) return;
            window.clearTimeout(timeout);
            cleanCallbackUrl();
            const message = error instanceof Error ? error.message : 'Não foi possível concluir o login.';
            setErrorMsg(/code verifier|code_verifier|flow state|flow_state|invalid_grant/i.test(message)
                ? 'Esta tentativa expirou ou foi iniciada em outro navegador. Comece o login novamente neste navegador.'
                : message);
        });

        return () => {
            active = false;
            window.clearTimeout(timeout);
        };
    }, []);

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
                    <p role="alert" style={{ color: '#ef4444', fontSize: 13, fontFamily: 'sans-serif', textAlign: 'center', maxWidth: 360, padding: '0 16px' }}>
                        {errorMsg}
                    </p>
                    <Link to="/auth" className="rounded-xl bg-white px-5 py-3 font-outfit text-sm text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Tentar novamente</Link>
                    <Link to="/" className="font-outfit text-xs text-white/60 hover:text-white">Voltar ao início</Link>
                </>
            ) : (
                <>
                    <div className="auth-callback-spinner" aria-hidden="true" style={{
                        width: 40,
                        height: 40,
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTop: '3px solid white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media (prefers-reduced-motion: reduce) { .auth-callback-spinner { animation: none !important; } }`}</style>
                    <p role="status" style={{
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
