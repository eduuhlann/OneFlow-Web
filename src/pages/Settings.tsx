import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft,
    User,
    Shield,
    Lock,
    LogOut,
    Trash2,
    ChevronRight,
    Info,
    ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Sub-views
import SecurityView from '../components/settings/SecurityView';
import LegalView from '../components/settings/LegalView';
import PageTransition from '../components/PageTransition';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type SettingsTab = 'main' | 'security' | 'legal';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('main');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const SettingItem = ({
        icon: Icon,
        title,
        subtitle,
        onClick,
        destructive = false,
        badge = null
    }: any) => (
        <button
            onClick={onClick}
            className={cn(
                "w-full p-6 flex items-center justify-between group transition-all border-b border-white/5 last:border-0",
                destructive ? "hover:bg-red-500/5" : "hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-6">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                    destructive ? "bg-red-500/10 text-red-500" : "bg-white/5 text-white/40 group-hover:text-white"
                )}>
                    <Icon size={22} />
                </div>
                <div className="text-left">
                    <h4 className={cn(
                        "font-bold text-lg tracking-tight",
                        destructive ? "text-red-500" : "text-white"
                    )}>{title}</h4>
                    {subtitle && <p className="text-white/40 text-xs font-light tracking-wide">{subtitle}</p>}
                </div>
            </div>
            <div className="flex items-center gap-4">
                {badge && (
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[8px] font-black tracking-widest uppercase">
                        {badge}
                    </span>
                )}
                {!destructive && <ChevronRight size={18} className="text-white/10 group-hover:text-white transition-colors" />}
            </div>
        </button>
    );

    const SettingSection = ({ title, children }: any) => (
        <div className="mb-12">
            <h3 className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase mb-4 px-6 italic">
                {title}
            </h3>
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
                {children}
            </div>
        </div>
    );

    const handleBack = () => {
        if (activeTab === 'main') {
            navigate('/dashboard');
        } else {
            setActiveTab('main');
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'security':
                return <SecurityView />;
            case 'legal':
                return <LegalView />;
            default:
                return (
                    <div className="space-y-12">
                        <SettingSection title="Conta & Perfil">
                            <SettingItem
                                icon={User}
                                title="Editar Perfil"
                                subtitle="Avatar, Banner e Nome"
                                onClick={() => navigate('/profile')}
                            />
                            <SettingItem
                                icon={Shield}
                                title="Segurança"
                                subtitle="Gerenciar sua senha e acesso"
                                onClick={() => setActiveTab('security')}
                            />
                        </SettingSection>

                        <SettingSection title="Apoio & Legal">
                            <SettingItem
                                icon={Info}
                                title="Termos e Privacidade"
                                onClick={() => setActiveTab('legal')}
                            />
                        </SettingSection>

                        <div className="space-y-4 px-6 pb-20">
                            <button
                                onClick={handleSignOut}
                                className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
                            >
                                <LogOut size={20} className="text-white/40 group-hover:text-white transition-colors" />
                                Sair da Conta
                            </button>
                            <button
                                onClick={() => setShowResetConfirm(true)}
                                className="w-full py-5 bg-red-500/5 border border-red-500/10 rounded-2xl font-bold text-red-500 flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all group"
                            >
                                <Trash2 size={20} className="text-red-500/40 group-hover:text-red-500 transition-colors" />
                                Redefinir Tudo
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <PageTransition>
        <div className="min-h-screen bg-black text-white p-6 md:p-12 overflow-x-hidden">
            <div className="max-w-3xl mx-auto">
                <header className="flex items-center justify-between mb-16">
                    <div className="flex items-center gap-12">
                        <button onClick={handleBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all md:-ml-16">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase">Ajustes OneFlow</span>
                            <h1 className="text-4xl font-black italic -rotate-1 tracking-tighter">
                                {activeTab === 'main' ? 'Configurações' : 'Ajustes'}
                            </h1>
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {showResetConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowResetConfirm(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#111] border border-red-500/20 p-12 rounded-[3.5rem] max-w-sm w-full relative z-10 text-center"
                        >
                            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter mb-4">Apagar Tudo?</h3>
                            <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium">Isso irá remover permanentemente todo o seu progresso, capítulos lidos e favoritos. Esta ação não poderá ser desfeita.</p>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="py-5 bg-white text-black rounded-2xl font-black text-xs tracking-widest"
                                >
                                    MANTER MEUS DADOS
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.reload();
                                    }}
                                    className="py-5 bg-white/5 text-red-500 rounded-2xl font-bold text-xs tracking-widest border border-white/5"
                                >
                                    REDEFINIR AGORA
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
        </PageTransition>
    );
};

export default Settings;
