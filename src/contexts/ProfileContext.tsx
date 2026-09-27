import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { isMissingColumnError } from '../lib/supabaseErrors';
import { useAuth } from './AuthContext';

export interface UserProfile {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string | null;
    short_bio: string | null;
    featured_verse: string | null;
    discord_decoration_url: string | null;
}

/** Colunas que dependem da migration v2 (short_bio, featured_verse) */
const OPTIONAL_COLUMNS = ['short_bio', 'featured_verse'] as const;

interface ProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    updateProfile: (updates: Partial<Omit<UserProfile, 'id'>>) => Promise<void>;
    refreshProfile: () => void;
    /** true quando o banco ainda não tem as colunas da migration v2 */
    needsMigration: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const stripOptional = <T extends Record<string, unknown>>(updates: T): T => {
    const copy: Record<string, unknown> = { ...updates };
    for (const column of OPTIONAL_COLUMNS) delete copy[column];
    return copy as T;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [needsMigration, setNeedsMigration] = useState(false);

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

    const updateProfile = async (updates: Partial<Omit<UserProfile, 'id'>>) => {
        if (!user) return;
        const payload = { id: user.id, ...updates };
        const { error } = await supabase.from('profiles').upsert(payload);

        if (error && isMissingColumnError(error)) {
            // Banco ainda sem a migration v2: salva o resto e sinaliza
            const { error: retryError } = await supabase
                .from('profiles')
                .upsert(stripOptional(payload));
            if (retryError) throw new Error(retryError.message);
            setNeedsMigration(true);
            await fetchProfile();
            return;
        }

        if (error) {
            throw new Error(error.message);
        }
        setNeedsMigration(false);
        await fetchProfile();
    };

    return (
        <ProfileContext.Provider value={{ profile, loading, updateProfile, refreshProfile: fetchProfile, needsMigration }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const ctx = useContext(ProfileContext);
    if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
    return ctx;
};
