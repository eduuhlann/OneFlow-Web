import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

export interface UserProfile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    total_xp: number;
    completed_lessons: number;
}

interface ProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'total_xp' | 'completed_lessons'>>) => Promise<void>;
    refreshProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data ?? null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'total_xp' | 'completed_lessons'>>) => {
        if (!user) return;
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...updates });

        if (error) {
            throw new Error(error.message);
        }
        await fetchProfile();
    };

    return (
        <ProfileContext.Provider value={{ profile, loading, updateProfile, refreshProfile: fetchProfile }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const ctx = useContext(ProfileContext);
    if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
    return ctx;
};
