import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Crown, Sparkles, Users, Image as ImageIcon, Brain, Check, ShieldCheck, RefreshCw, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePro } from '../contexts/ProContext';
import PageTransition from '../components/PageTransition';

const CHECKOUT_URL = import.meta.env.VITE_LASTLINK_CHECKOUT_URL || '';

const FEATURES = [
    { icon: ImageIcon, title: 'Banner personalizado', description: 'Destaque seu perfil com uma arte única no topo.' },
    { icon: Users, title: 'Criar grupos de discipulado', description: 'Forme grupos e acompanhe o crescimento em conjunto.' },
    { icon: Brain, title: 'Gerador de planos com IA', description: 'Planos de estudo personalizados gerados por IA.' },
    { icon: Sparkles, title: 'Novos benefícios em breve', description: 'Sua assinatura sustenta o projeto e desbloqueia tudo que está por vir.' },
];

export default function Pro() {
    const navigate = useNavigate();
    const { isPro, loading, refreshPro } = usePro();

    const handleSubscribe = () => {
        if (!CHECKOUT_URL) return;
        window.open(CHECKOUT_URL, '_blank', 'noopener,noreferrer');
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-white/20">
                <div className="max-w-4xl mx-auto px-0 py-4 md:py-8 md:pt-12 mb-20 relative z-10">
                    <header className="flex items-center gap-6 mb-10">
                        <button
                            onClick={() => navigate('/settings')}
                            className="group ml-0 md:ml-0 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all text-white/50 hover:text-white"
                        >
                            <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-serif font-black italic -rotate-1 tracking-tighter">OneFlow Pro</h1>
                        </div>
                    </header>

                    {/* Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/10 mb-8 p-8 md:p-12 relative"
                    >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500" />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border transition-all ${isPro ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.15)]' : 'bg-white/5 border-white/10 text-white/30'}`}>
                                    <Crown size={36} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black tracking-widest text-white/20 uppercase block mb-1">
                                        {loading ? 'Verificando' : isPro ? 'Assinatura ativa' : 'Status'}
                                    </span>
                                    <h2 className="text-3xl font-black italic tracking-tighter">
                                        {loading ? '...' : isPro ? 'Você é OneFlow Pro' : 'Plano gratuito'}
                                    </h2>
                                    {!loading && (
                                        <p className={`text-sm mt-1 ${isPro ? 'text-yellow-300/60' : 'text-white/30'}`}>
                                            {isPro ? 'Todos os recursos liberados. Obrigado por apoiar!' : 'Assine por R$ 29,90/mês e desbloqueie tudo.'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-stretch md:items-end gap-3">
                                {isPro ? (
                                    <button
                                        onClick={refreshPro}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-black tracking-widest uppercase text-white/60 hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        <RefreshCw size={14} /> Revalidar acesso
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubscribe}
                                        disabled={!CHECKOUT_URL}
                                        className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-2xl font-black text-xs tracking-[0.15em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 shadow-[0_10px_40px_-10px_rgba(250,204,21,0.5)] inline-flex items-center gap-3"
                                    >
                                        <Crown size={16} />
                                        Assinar agora · R$ 29,90/mês
                                        {CHECKOUT_URL && <ExternalLink size={14} className="opacity-60" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {!isPro && !CHECKOUT_URL && (
                            <p className="mt-6 text-[10px] font-bold tracking-widest text-white/20 uppercase">
                                Configure VITE_LASTLINK_CHECKOUT_URL para habilitar o botão de assinatura.
                            </p>
                        )}
                    </motion.div>

                    {/* Benefits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-7 group hover:border-yellow-400/30 transition-all"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-yellow-300/80 group-hover:border-yellow-400/20 transition-all mb-5">
                                    <f.icon size={24} />
                                </div>
                                <h3 className="font-black italic tracking-tighter text-lg mb-1.5">{f.title}</h3>
                                <p className="text-white/40 text-sm font-medium leading-relaxed">{f.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Por que assinar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl flex items-center justify-center text-yellow-300/70">
                                <ShieldCheck size={22} />
                            </div>
                            <h3 className="font-black italic tracking-tighter text-xl">Você sustenta um projeto independente</h3>
                        </div>
                        <p className="text-white/40 text-sm font-medium leading-relaxed">
                            O OneFlow é um projeto pessoal, sem fins lucrativos e sem investidores. A assinatura Pro é o que
                            mantém os servidores ativos e financia o desenvolvimento de novos recursos — sem anúncios e sem
                            vender seus dados.
                        </p>
                        <div className="mt-6 flex items-center gap-3 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                            <Check size={12} /> Cancele quando quiser
                            <span className="text-white/10">·</span>
                            <Check size={12} /> Pagamento via Lastlink
                        </div>
                    </motion.div>
                </div>
            </div>
        </PageTransition>
    );
}