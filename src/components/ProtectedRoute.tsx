import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl" />
                    <span className="text-[10px] font-bold tracking-[0.2em] opacity-40">CARREGANDO...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
