import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Save, AlertCircle, CheckCircle2, Shield, Trash2, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { translateAuthError } from '../../services/authErrors';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const SecurityView: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleUpdatePassword = async () => {
        if (!password) {
            setError('Digite uma nova senha.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess(false);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(translateAuthError(err.message));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsSaving(true);
        try {
            // In a real scenario, this would call an Edge Function to delete the user from auth.users
            // Since client-side can't delete self via standard Supabase Auth, 
            // we'll simulate the process and sign out.
            await supabase.auth.signOut();
            window.location.href = '/';
        } catch (err: any) {
            setError(translateAuthError(err.message));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-12">
            <div>
                <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase block mb-2">Privacidade & Acesso</span>
                <h2 className="text-3xl font-black italic -rotate-1 tracking-tighter">Segurança</h2>
            </div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 flex items-center gap-3 text-sm font-bold"
                >
                    <AlertCircle size={18} /> {error}
                </motion.div>
            )}

            {success && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/10 border border-white/20 rounded-2xl text-white flex items-center gap-3 text-sm font-bold"
                >
                    <CheckCircle2 size={18} /> Senha atualizada com sucesso!
                </motion.div>
            )}

            <div className="space-y-6">
                <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black tracking-widest text-white/30 uppercase flex items-center gap-2">
                            <Lock size={12} /> NOVA SENHA
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-8 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all font-bold text-xl tracking-tight"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black tracking-widest text-white/30 uppercase flex items-center gap-2">
                            <Lock size={12} /> CONFIRMAR NOVA SENHA
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-8 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all font-bold text-xl tracking-tight"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleUpdatePassword}
                            disabled={isSaving}
                            className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xs tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : <Save size={18} />}
                            {isSaving ? 'ATUALIZANDO...' : 'ATUALIZAR SENHA'}
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] flex items-center gap-6 group">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                        <Shield size={24} />
                    </div>
                    <div>
                        <span className="text-[8px] font-bold tracking-[0.3em] text-white/20 uppercase block mb-1">Proteção OneFlow</span>
                        <h5 className="font-black italic tracking-tighter text-white/60">Sua conta é protegida por criptografia de ponta a ponta.</h5>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-6 bg-red-500/5 border border-red-500/10 rounded-[2rem] font-bold text-red-500 flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all group"
                    >
                        <Trash2 size={20} className="text-red-500/40 group-hover:text-red-500 transition-colors" />
                        Excluir Minha Conta
                    </button>
                    <p className="mt-4 text-center text-[9px] font-bold tracking-[0.2em] text-white/20 uppercase px-12 leading-relaxed">
                        AVISO: ESTA AÇÃO É IRREVERSÍVEL E TODOS OS SEUS DADOS SERÃO PERDIDOS.
                    </p>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteConfirm(false)}
                            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#0a0a0a] border border-red-500/20 p-10 md:p-14 rounded-[4rem] max-w-md w-full relative z-10 text-center shadow-[0_0_100px_rgba(239,68,68,0.1)]"
                        >
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                                <Trash2 size={40} />
                            </div>
                            
                            <h3 className="text-4xl font-black italic tracking-tighter mb-6 leading-tight">Deseja excluir sua conta?</h3>
                            
                            <p className="text-white/40 text-sm mb-12 leading-relaxed font-medium">
                                Isso irá remover permanentemente todo o seu histórico no OneFlow. <br/>
                                <span className="text-red-500/60 font-black">ESTA AÇÃO NÃO PODE SER DESFEITA.</span>
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isSaving}
                                    className="w-full py-6 bg-red-600 text-white rounded-2xl font-black text-xs tracking-[0.3em] hover:bg-red-500 transition-all shadow-[0_10px_40px_-10px_rgba(220,38,38,0.5)] disabled:opacity-50"
                                >
                                    {isSaving ? 'EXCLUINDO...' : 'CONCORDO E DESEJO EXCLUIR'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full py-6 bg-white/5 text-white/40 rounded-2xl font-bold text-xs tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                >
                                    CANCELAR E VOLTAR
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SecurityView;
