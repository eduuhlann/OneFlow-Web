import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Crown, Sparkles, Users, Image as ImageIcon, Brain, Check, ShieldCheck, RefreshCw, ExternalLink, ChevronDown, X, HeartHandshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePro } from '../contexts/ProContext';
import PageTransition from '../components/PageTransition';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const CHECKOUT_URL = import.meta.env.VITE_LASTLINK_CHECKOUT_URL || '';
const PRICE = 'R$ 29,90';

const FEATURES = [
    {
        icon: ImageIcon,
        title: 'Banner personalizado',
        description: 'Destaque seu perfil com uma arte única no topo. Identidade visual sem limites.',
    },
    {
        icon: Users,
        title: 'Grupos de discipulado',
        description: 'Forme grupos, convide amigos e acompanhem o crescimento espiritual juntos.',
    },
    {
        icon: Brain,
        title: 'Gerador de planos com IA',
        description: 'Planos de estudo personalizados, criados pela IA em segundos, no seu ritmo.',
    },
];

const FREE_FEATURES = [
    'Perfil com avatar e nome',
    'Planos de leitura ilimitados',
    'Bíblia completa + modo offline',
    'Metas, oração e estatísticas',
];

const PRO_FEATURES = [
    ...FREE_FEATURES.map((f) => ([f, true] as const)),
    ['Banner personalizado no perfil', false],
    ['Grupos de discipulado', false],
    ['Gerador de planos com IA', false],
    ['Acesso antecipado a novos recursos', false],
] as const;

const FAQ = [
    {
        q: 'Como funciona a assinatura?',
        a: 'O pagamento é rápido e seguro via Lastlink (Pix ou cartão). Assim que a confirmação chega, o seu acesso Pro é liberado automaticamente na sua conta.',
    },
    {
        q: 'Posso cancelar quando quiser?',
        a: 'Sim. Você pode cancelar quando quiser, sem multa e sem burocracia. A assinatura mantém o acesso até o fim do ciclo já pago.',
    },
    {
        q: 'O acesso é instantâneo?',
        a: 'Normalmente sim. O webhook da Lastlink atualiza sua assinatura automaticamente. Se precisar, use o botão "Revalidar acesso" na página.',
    },
    {
        q: 'E se eu quiser voltar ao plano gratuito?',
        a: 'Sem problemas. Ao cancelar, você volta automaticamente ao plano gratuito ao final do ciclo, mantendo todos os seus dados e planos salvos.',
    },
];

export default function Pro() {
    const navigate = useNavigate();
    const { isPro, loading, refreshPro, subscription } = usePro();
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const startedDate = subscription?.started_at
        ? new Date(subscription.started_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        : null;

    const handleSubscribe = () => {
        if (!CHECKOUT_URL) return;
        window.open(CHECKOUT_URL, '_blank', 'noopener,noreferrer');
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-white/20">
                {/* Background glow */}
                <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-amber-200/[0.06] rounded-full blur-[140px]" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-white/[0.03] rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-0 py-4 md:py-8 md:pt-12 mb-20">
                    <header className="flex items-center gap-6 mb-10">
                        <button
                            onClick={() => navigate('/settings')}
                            className="group ml-0 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all text-white/50 hover:text-white"
                        >
                            <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl sm:text-4xl font-serif font-black italic -rotate-1 tracking-tighter">OneFlow Pro</h1>
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-200/10 border border-amber-200/20 rounded-full text-[9px] font-black tracking-[0.2em] text-amber-200/90 uppercase">
                                <Crown size={11} /> Premium
                            </span>
                        </div>
                    </header>

                    {/* Status card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            'bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border mb-8 p-8 md:p-12 relative',
                            isPro ? 'border-amber-200/20' : 'border-white/10'
                        )}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        <div className={cn(
                            'absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full blur-[120px] pointer-events-none',
                            isPro ? 'bg-amber-200/[0.10]' : 'bg-white/[0.05]'
                        )} />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative">
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    'w-20 h-20 rounded-[2rem] flex items-center justify-center border transition-all',
                                    isPro ? 'bg-amber-200/10 border-amber-200/30 text-amber-200 shadow-[0_0_60px_rgba(253,230,138,0.15)]' : 'bg-white/5 border-white/10 text-white/30'
                                )}>
                                    <Crown size={36} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <span className={cn(
                                        'text-[10px] font-black tracking-widest uppercase block mb-1',
                                        isPro ? 'text-amber-200/70' : 'text-white/20'
                                    )}>
                                        {loading ? 'Verificando' : isPro ? 'Assinatura ativa' : 'Status'}
                                    </span>
                                    <h2 className="text-3xl font-black italic tracking-tighter">
                                        {loading ? '...' : isPro ? 'Você é OneFlow Pro' : 'Plano gratuito'}
                                    </h2>
                                    {!loading && (
                                        <p className={cn('text-sm mt-1', isPro ? 'text-white/50' : 'text-white/30')}>
                                            {isPro
                                                ? startedDate
                                                    ? `Assinante desde ${startedDate}. Todos os recursos liberados.`
                                                    : 'Todos os recursos liberados. Obrigado por apoiar!'
                                                : `Assine por ${PRICE}/mês e desbloqueie tudo.`}
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
                                        className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs tracking-[0.15em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.35)] inline-flex items-center gap-3 hover:bg-white/90"
                                    >
                                        <Crown size={16} strokeWidth={2.5} />
                                        Assinar agora · {PRICE}/mês
                                        {CHECKOUT_URL && <ExternalLink size={14} className="opacity-60" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {!isPro && !CHECKOUT_URL && (
                            <p className="mt-6 text-[10px] font-bold tracking-widest text-white/20 uppercase relative">
                                Configure VITE_LASTLINK_CHECKOUT_URL para habilitar o botão de assinatura.
                            </p>
                        )}
                    </motion.div>

                    {/* Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-[#0a0a0a] px-8 py-14 md:px-16 md:py-20 mb-8 text-center"
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[300px] bg-amber-200/[0.08] rounded-full blur-[130px] pointer-events-none" />

                        <div className="relative">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black tracking-[0.3em] text-white/40 uppercase mb-8">
                                <Sparkles size={12} className="text-amber-200" />
                                O plano completo do OneFlow
                            </span>

                            <h2 className="font-serif font-black italic tracking-tighter text-4xl sm:text-6xl leading-[0.95] mb-6">
                                Desbloqueie a versão
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100">
                                    completa do OneFlow
                                </span>
                            </h2>

                            <p className="max-w-xl mx-auto text-white/40 text-sm sm:text-base font-medium leading-relaxed mb-10">
                                Banner exclusivo, grupos de discipulado e planos de estudo gerados por IA.
                                Um investimento de <span className="text-white font-black">{PRICE}/mês</span> para transformar sua caminhada.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={handleSubscribe}
                                    disabled={!CHECKOUT_URL || isPro}
                                    className="px-10 py-5 bg-white text-black rounded-2xl font-black text-sm tracking-[0.15em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 shadow-[0_20px_60px_-15px_rgba(255,255,255,0.4)] inline-flex items-center gap-3 hover:bg-white/90"
                                >
                                    <Crown size={18} strokeWidth={2.5} />
                                    {isPro ? 'Você já é Pro' : `Assinar · ${PRICE}/mês`}
                                    {CHECKOUT_URL && !isPro && <ExternalLink size={15} className="opacity-60" />}
                                </button>
                                {isPro && (
                                    <button
                                        onClick={refreshPro}
                                        className="px-8 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-xs tracking-[0.15em] uppercase text-white/60 hover:bg-white/10 hover:text-white transition-all inline-flex items-center gap-3"
                                    >
                                        <RefreshCw size={16} /> Revalidar acesso
                                    </button>
                                )}
                            </div>

                            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-black tracking-widest text-white/25 uppercase">
                                <span className="inline-flex items-center gap-2"><Check size={12} className="text-amber-200" /> Cancelamento livre</span>
                                <span className="inline-flex items-center gap-2"><Check size={12} className="text-amber-200" /> Pagamento via Lastlink</span>
                                <span className="inline-flex items-center gap-2"><Check size={12} className="text-amber-200" /> Sem anúncios</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Benefits */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-7 group hover:border-amber-200/20 hover:bg-white/[0.03] transition-all relative overflow-hidden"
                            >
                                <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-200/[0.04] rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-amber-200 group-hover:border-amber-200/30 transition-all mb-5">
                                    <f.icon size={24} strokeWidth={1.75} />
                                </div>
                                <h3 className="font-black italic tracking-tighter text-lg mb-1.5">{f.title}</h3>
                                <p className="text-white/40 text-sm font-medium leading-relaxed">{f.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Comparison */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-10 mb-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center text-white/70">
                                <ShieldCheck size={22} strokeWidth={1.75} />
                            </div>
                            <h3 className="font-black italic tracking-tighter text-xl">O que você desbloqueia</h3>
                        </div>

                        <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-px bg-white/10 border border-white/10 rounded-3xl overflow-hidden mb-10">
                            <div className="bg-[#0f0f0f] px-5 py-4 text-[10px] font-black tracking-widest text-white/40 uppercase">Recurso</div>
                            <div className="bg-[#0f0f0f] px-5 py-4 text-center text-[10px] font-black tracking-widest text-white/40 uppercase">Grátis</div>
                            <div className="bg-amber-200/10 px-5 py-4 text-center text-[10px] font-black tracking-widest text-amber-200 uppercase inline-flex items-center justify-center gap-1.5">
                                <Crown size={11} /> Pro
                            </div>
                            {PRO_FEATURES.map(([label, free], i) => {
                                const inFree = i < FREE_FEATURES.length && free;
                                return (
                                    <Fragment key={i}>
                                        <div className="bg-[#0f0f0f] px-5 py-4 text-sm font-medium text-white/70">{label}</div>
                                        <div className="bg-[#0f0f0f] px-5 py-4 flex items-center justify-center">
                                            {inFree ? (
                                                <Check size={16} className="text-white/40" />
                                            ) : (
                                                <X size={16} className="text-white/15" />
                                            )}
                                        </div>
                                        <div className="bg-amber-200/[0.03] px-5 py-4 flex items-center justify-center">
                                            <Check size={16} className={i < FREE_FEATURES.length ? 'text-amber-200/80' : 'text-amber-200'} />
                                        </div>
                                    </Fragment>
                                );
                            })}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl bg-white/[0.03] border border-white/10 p-6 md:p-8">
                            <div>
                                <h4 className="font-black italic tracking-tighter text-lg mb-1">Pronto para desbloquear tudo?</h4>
                                <p className="text-white/40 text-sm font-medium">
                                    {PRICE}/mês. Cancele quando quiser, no seu ritmo.
                                </p>
                            </div>
                            <button
                                onClick={handleSubscribe}
                                disabled={!CHECKOUT_URL || isPro}
                                className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs tracking-[0.15em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.35)] inline-flex items-center gap-3 hover:bg-white/90 shrink-0"
                            >
                                <Crown size={16} strokeWidth={2.5} />
                                {isPro ? 'Assinatura ativa' : 'Assinar agora'}
                            </button>
                        </div>
                    </motion.div>

                    {/* FAQ */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="mb-8"
                    >
                        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10">
                            <h3 className="font-black italic tracking-tighter text-xl mb-6">Perguntas frequentes</h3>
                            <div className="space-y-3">
                                {FAQ.map((item, i) => (
                                    <div
                                        key={i}
                                        className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a]"
                                    >
                                        <button
                                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                            className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
                                        >
                                            <span className="font-black italic tracking-tight text-base">{item.q}</span>
                                            <ChevronDown
                                                size={18}
                                                className={cn(
                                                    'shrink-0 text-white/40 transition-transform duration-300',
                                                    openFaq === i && 'rotate-180 text-amber-200'
                                                )}
                                            />
                                        </button>
                                        <AnimatePresence initial={false}>
                                            {openFaq === i && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                >
                                                    <p className="px-6 pb-6 text-white/40 text-sm font-medium leading-relaxed">
                                                        {item.a}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Project support */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden"
                    >
                        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-200/[0.05] rounded-full blur-[100px] pointer-events-none" />
                        <div className="flex items-center gap-4 mb-6 relative">
                            <div className="w-12 h-12 bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center text-amber-200">
                                <HeartHandshake size={22} strokeWidth={1.75} />
                            </div>
                            <h3 className="font-black italic tracking-tighter text-xl">Você sustenta um projeto independente</h3>
                        </div>
                        <p className="text-white/40 text-sm font-medium leading-relaxed relative">
                            O OneFlow é um projeto pessoal, sem fins lucrativos e sem investidores. A assinatura Pro é o que
                            mantém os servidores ativos e financia o desenvolvimento de novos recursos — sem anúncios e sem
                            vender seus dados.
                        </p>
                        <div className="mt-6 flex items-center gap-3 text-[10px] font-bold tracking-widest text-white/30 uppercase relative">
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
