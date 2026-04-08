import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function AuthCallback() {
    const navigate = useNavigate();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const handleCallback = async () => {
            // Supabase detectSessionInUrl faz o exchange automaticamente.
            // Só precisa esperar o onAuthStateChange disparar.
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    subscription.unsubscribe();
                    navigate('/dashboard', { replace: true });
                } else if (event === 'SIGNED_OUT' || !session) {
                    subscription.unsubscribe();
                    navigate('/auth', { replace: true });
                }
            });

            // Timeout de segurança: se demorar mais de 5s, manda pro auth
            setTimeout(() => {
                subscription.unsubscribe();
                supabase.auth.getSession().then(({ data: { session } }) => {
                    navigate(session ? '/dashboard' : '/auth', { replace: true });
                });
            }, 5000);
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
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                Autenticando...
            </p>
        </div>
    );
}
