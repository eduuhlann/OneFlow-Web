import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, X, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { supabase } from '../services/supabase';

interface MfaVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
}

export const MfaVerificationModal: React.FC<MfaVerificationModalProps> = ({ isOpen, onClose, onVerified }) => {
    const [step, setStep] = useState<'loading' | 'enroll' | 'verify'>('loading');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [factorId, setFactorId] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            checkMfaStatus();
        } else {
            // Reset state when closing
            setStep('loading');
            setQrCode(null);
            setFactorId(null);
            setCode('');
            setError('');
        }
    }, [isOpen]);

    const checkMfaStatus = async () => {
        setStep('loading');
        try {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;

            const totpFactor = data.all.find(f => f.factor_type === 'totp' && f.status === 'verified');
            
            if (totpFactor) {
                setFactorId(totpFactor.id);
                setStep('verify');
            } else {
                startEnrollment();
            }
        } catch (err: any) {
            setError(err.message);
            setStep('verify');
        }
    };

    const startEnrollment = async () => {
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                issuer: 'OneFlow',
            });
            if (error) throw error;

            setFactorId(data.id);
            if (data.totp.qr_code) {
                setQrCode(data.totp.qr_code);
            }
            setStep('enroll');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleVerify = async () => {
        if (code.length < 6 || !factorId) return;
        setLoading(true);
        setError('');
        
        try {
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId
            });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challengeData.id,
                code
            });

            if (verifyError) throw verifyError;

            onVerified();
        } catch (err: any) {
            setError('Código inválido ou expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 sm:p-12">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                        
                        <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/10 text-white/80 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                                <Shield size={32} />
                            </div>

                            <h3 className="text-3xl font-black italic tracking-tighter mb-4">
                                {step === 'enroll' ? 'Segurança Adicional' : 'Verificar Mudança'}
                            </h3>
                            
                            <p className="text-white/40 text-sm mb-8 leading-relaxed px-4">
                                {step === 'enroll' 
                                    ? 'Para garantir a unicidade do seu nome, precisamos ativar o Google Authenticator.' 
                                    : 'Insira o código de 6 dígitos para confirmar que é você.'}
                            </p>

                            {step === 'loading' ? (
                                <div className="py-12">
                                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                                </div>
                            ) : step === 'enroll' ? (
                                <div className="space-y-8 w-full">
                                    {qrCode && (
                                        <div className="bg-white p-4 rounded-3xl mx-auto w-fit shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                            <img src={qrCode} alt="QR Code MFA" className="w-48 h-48" />
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest justify-center">
                                            <Smartphone size={12} /> Escaneie com seu app autenticador
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={code}
                                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000 000"
                                                className="w-full bg-transparent text-center text-4xl font-black tracking-[0.3em] outline-none text-white"
                                            />
                                        </div>
                                    </div>
                                    {error && (
                                        <div className="text-red-500 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleVerify}
                                        disabled={code.length < 6 || loading}
                                        className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs tracking-[0.3em] uppercase transition-all shadow-[0_10px_40px_-10px_rgba(255,255,255,0.4)]"
                                    >
                                        {loading ? 'VERIFICANDO...' : 'ATIVAR E SALVAR'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8 w-full">
                                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000 000"
                                            className="w-full bg-transparent text-center text-5xl font-bold tracking-tighter outline-none text-white"
                                            autoFocus
                                        />
                                    </div>
                                    {error && (
                                        <div className="text-red-500 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleVerify}
                                        disabled={code.length < 6 || loading}
                                        className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs tracking-[0.3em] uppercase transition-all"
                                    >
                                        {loading ? 'AUTENTICANDO...' : 'CONFIRMAR MUDANÇA'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
