import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Save, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { supabase } from '../../services/supabase';
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
            setError(err.message || 'Erro ao atualizar senha.');
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
            </div>
        </div>
    );
};

export default SecurityView;
