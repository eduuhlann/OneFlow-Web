import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'classic-dark' | 'royal-purple' | 'midnight-blue' | 'pure-monochrome';
export type WallpaperType = 'particles' | 'mesh' | 'aurora' | 'none';
export type DashboardLayoutItem = 'nav' | 'stats' | 'journey';

export interface UserPreferences {
    theme: ThemeType;
    wallpaper: WallpaperType;
    dashboardLayout: DashboardLayoutItem[];
}

const defaultPreferences: UserPreferences = {
    theme: 'classic-dark',
    wallpaper: 'particles',
    dashboardLayout: ['nav', 'stats', 'journey']
};

interface PreferencesContextType {
    preferences: UserPreferences;
    updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
    resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const PREFERENCES_KEY = '@oneflow_user_preferences';

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [preferences, setPreferences] = useState<UserPreferences>(() => {
        const saved = localStorage.getItem(PREFERENCES_KEY);
        if (saved) {
            try {
                return { ...defaultPreferences, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Failed to parse user preferences", e);
            }
        }
        return defaultPreferences;
    });

    useEffect(() => {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
        
        // Apply theme data attribute to document root for global CSS scoping
        document.documentElement.setAttribute('data-theme', preferences.theme);
        
    }, [preferences]);

    const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const resetPreferences = () => {
        setPreferences(defaultPreferences);
    };

    return (
        <PreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => {
    const context = useContext(PreferencesContext);
    if (!context) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
};
