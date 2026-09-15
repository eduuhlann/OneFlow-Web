import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

export interface ProSubscription {
    id: string;
    user_id: string;
    status: string;
    plan: string;
    lastlink_subscription_id: string | null;
    lastlink_product_id: string | null;
    started_at: string | null;
    updated_at: string | null;
}

interface ProContextType {
    isPro: boolean;
    loading: boolean;
    subscription: ProSubscription | null;
    refreshPro: () => void;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export const ProProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<ProSubscription | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPro = useCallback(async () => {
        if (!user) {
            setSubscription(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .eq('plan', 'oneflow_pro')
                .maybeSingle();

            if (error) {
                console.error('Error fetching subscription:', error);
            } else {
                setSubscription(data as ProSubscription | null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPro();
    }, [fetchPro]);

    const isPro = !!subscription && subscription.status === 'active';

    return (
        <ProContext.Provider value={{ isPro, loading, subscription, refreshPro: fetchPro }}>
            {children}
        </ProContext.Provider>
    );
};

export const usePro = () => {
    const ctx = useContext(ProContext);
    if (!ctx) throw new Error('usePro must be used within a ProProvider');
    return ctx;
};