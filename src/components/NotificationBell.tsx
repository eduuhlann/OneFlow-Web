import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { discipleshipService } from '../services/features/discipleshipService';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        // Initial load
        const loadCount = async () => {
            const c = await discipleshipService.getNotificationCount(user.id);
            setCount(c);
        };
        loadCount();

        // Subscribe to changes in notes and connections
        const notesChannel = supabase
            .channel('notification-sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'discipleship_notes'
                },
                () => loadCount()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'discipleship_connections',
                    filter: `disciple_id=eq.${user.id}`
                },
                () => loadCount()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(notesChannel);
        };
    }, [user]);

    return (
        <button
            onClick={() => navigate('/discipleship')}
            className="group relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
        >
            <motion.svg 
                viewBox="0 0 448 512" 
                className="w-5 h-5 md:w-6 md:h-6 fill-white"
                whileHover={{
                    rotate: [0, 10, -10, 5, -5, 2, 0],
                    transition: { duration: 0.9, ease: "easeInOut" }
                }}
            >
                <path d="M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96h8c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V200c0-57.4 46.6-104 104-104h8zm64 352H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z" />
            </motion.svg>

            <AnimatePresence>
                {count > 0 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-black flex items-center justify-center"
                    >
                        <span className="text-[10px] font-black text-white">{count > 9 ? '9+' : count}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
};
