import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ChevronRight, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const FeedbackView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { user } = useAuth();
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        setSubmitting(true);
        const userName = user?.user_metadata?.name || user?.email || 'Usuário Anônimo';
        
        const data = {
            username: userName,
            feedback: feedback
        };

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (res.ok) {
                setSubmitted(true);
                setFeedback('');
                setTimeout(() => {
                    onBack();
                }, 2000);
            } else {
                console.error('Falha ao salvar feedback');
            }
        } catch (error) {
            console.error('Erro ao enviar feedback', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            key="content-feedback"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
        >
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-[10px] font-black tracking-widest text-white/40 uppercase hover:text-white transition-colors"
            >
                <ChevronRight size={14} className="rotate-180" /> VOLTAR PARA CONFIGURAÇÕES
            </button>

            <div className="space-y-8">
                <div>
                    <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase block mb-2">Comunidade</span>
                    <h2 className="text-4xl font-black italic -rotate-1 tracking-tighter flex items-center gap-4">
                        <MessageSquare className="text-white/40" /> 
                        Enviar Feedback
                    </h2>
                    <p className="text-white/40 text-sm mt-4 italic font-medium">Sua opinião é fundamental para melhorarmos a plataforma.</p>
                </div>
                
                <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] prose prose-invert max-w-none">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-emerald-400">
                            <CheckCircle2 size={64} className="mb-4 opacity-80" />
                            <h3 className="text-2xl font-black italic -rotate-1 mb-2">Obrigado pelo seu feedback!</h3>
                            <p className="text-white/60">Seu feedback foi salvo com sucesso na pasta do projeto!</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mb-4">
                                    Conte-nos a sua ideia, bugs ou sugestões
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Escreva seu feedback aqui..."
                                    className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all resize-none italic"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!feedback.trim() || submitting}
                                className="w-full py-5 bg-white/10 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <Send size={20} className="text-white/40 group-hover:text-white transition-colors" />
                                {submitting ? 'Enviando...' : 'Enviar Feedback'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default FeedbackView;
