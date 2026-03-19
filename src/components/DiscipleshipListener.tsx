import React, { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const DiscipleshipListener: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!user) return;

        // Listen for new connections or updates to existing ones
        const channel = supabase
            .channel('discipleship-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'discipleship_connections',
                    filter: `disciple_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('New discipleship connection received:', payload);
                    if (location.pathname !== '/discipleship') {
                        // Redirect if not already on the page
                        navigate('/discipleship');
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'discipleship_connections',
                    filter: `disciple_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.new.status === 'active' && location.pathname !== '/discipleship') {
                        navigate('/discipleship');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, navigate, location.pathname]);

    return null; // This component doesn't render anything
};
