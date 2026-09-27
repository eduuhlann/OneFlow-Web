import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Users, Lock, Globe2, Check, Crown } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import { useAuth } from '../contexts/AuthContext';
import {
    aiPlansService,
    INTENSITY_LABEL,
    STYLE_LABEL,
    FORMAT_LABEL,
    OBJECTIVES,
    type PlanIntensity,
    type PlanStyle,
    type PlanFormat,
    type PlanMode,
    type PlanPrivacy,
} from '../services/features/aiPlansService';
import logo from '../assets/logo.png';
import { Loading } from '../components/Loading';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Step =
    | 'goal' | 'duration' | 'intensity' | 'format'
    | 'style' | 'situation' | 'share' | 'generating' | 'success';

const WIZARD_STEPS: Step[] = ['goal', 'duration', 'intensity', 'format', 'style', 'situation', 'share'];

const DURATIONS = [3, 5, 7, 14, 21, 30, 60, 365];

const INTENSITIES: { id: PlanIntensity; label: string; desc: string }[] = [
    { id: 'rapido', label: '5 min/dia', desc: 'Uma leitura e um versículo' },
    { id: 'normal', label: '15 min/dia', desc: 'Leitura, reflexão e aplicação' },
    { id: 'profundo', label: '30-45 min/dia', desc: 'Contexto, estudo e perguntas' },
    { id: 'estudo', label: '1h+ por dia', desc: 'Aprofundamento com memorização' },
];

const STYLES: { id: PlanStyle; desc: string }[] = [
    { id: 'direto', desc: 'Frases curtas, sem rodeios' },
    { id: 'profundo', desc: 'Camadas de significado e contexto' },
    { id: 'devocional', desc: 'Acolhedor, como uma carta pessoal' },
    { id: 'academico', desc: 'Exegese, termos técnicos, rigor' },
    { id: 'jovem', desc: 'Linguagem atual e acessível' },
    { id: 'reflexivo', desc: 'Perguntas que provocam introspecção' },
    { id: 'pratico', desc: 'Foco em tarefas e hábitos' },
];

const PERSONALITIES = [
    { id: 'mentor', label: 'Mentor que encoraja', desc: '"Você está no caminho certo."' },
    { id: 'mestre', label: 'Mestre direto', desc: '"Sem desculpas, vamos ao ponto."' },
    { id: 'amigo', label: 'Amigo que escuta', desc: '"Vamos conversar sobre isso."' },
    { id: 'guia', label: 'Guia silencioso', desc: '"Observe. Reze. Decida."' },
];

const FORMATS: PlanFormat[] = ['leitura', 'reflexao', 'oracao', 'perguntas', 'aplicacao', 'desafio', 'memorizacao', 'contexto'];

const GENERATING_STAGES = [
    'Entendendo o seu objetivo...',
    'Escolhendo as leituras certas...',
    'Escrevendo as reflexões...',
    'Criando orações e aplicações...',
    'Montando seu plano...',
];

export default function AiPlanGenerator() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [currentStep, setCurrentStep] = useState<Step>('goal');
    const [theme, setTheme] = useState('');
    const [objective, setObjective] = useState('');
    const [duration, setDuration] = useState(7);
    const [customDuration, setCustomDuration] = useState('');
    const [intensity, setIntensity] = useState<PlanIntensity>('normal');
    const [formats, setFormats] = useState<PlanFormat[]>(['leitura', 'reflexao', 'aplicacao']);
    const [style, setStyle] = useState<PlanStyle>('devocional');
    const [personality, setPersonality] = useState('mentor');
    const [situation, setSituation] = useState('');
    const [mode, setMode] = useState<PlanMode>('individual');
    const [privacy, setPrivacy] = useState<PlanPrivacy>('private');

    const [stageIndex, setStageIndex] = useState(0);
    const [isThinking, setIsThinking] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [createdPlanId, setCreatedPlanId] = useState<string | null>(null);
    const [createdTitle, setCreatedTitle] = useState('');
    const [createdDescription, setCreatedDescription] = useState('');
    const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const finalDuration = customDuration ? Math.min(365, Math.max(1, parseInt(customDuration) || 1)) : duration;
    const stepIndex = WIZARD_STEPS.indexOf(currentStep);
    const isWizard = stepIndex >= 0;

    useEffect(() => {
        window.scrollTo(0, 0);
        return () => {
            if (stageTimer.current) clearInterval(stageTimer.current);
        };
    }, []);

    useEffect(() => {
        if (currentStep === 'generating') {
            setStageIndex(0);
            stageTimer.current = setInterval(() => {
                setStageIndex(i => Math.min(i + 1, GENERATING_STAGES.length - 1));
            }, 3200);
        } else if (stageTimer.current) {
            clearInterval(stageTimer.current);
            stageTimer.current = null;
        }
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep === 'goal' && theme.trim()) setCurrentStep('duration');
        else if (currentStep === 'duration' && finalDuration > 0) setCurrentStep('intensity');
        else if (currentStep === 'intensity') setCurrentStep('format');
        else if (currentStep === 'format' && formats.length > 0) setCurrentStep('style');
        else if (currentStep === 'style') setCurrentStep('situation');
        else if (currentStep === 'situation') setCurrentStep('share');
    };

    const handleBack = () => {
        const i = WIZARD_STEPS.indexOf(currentStep);
        if (i > 0) setCurrentStep(WIZARD_STEPS[i - 1]);
        else navigate('/plans');
    };

    const toggleFormat = (f: PlanFormat) => {
        setFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
    };

    const generatePlan = async () => {
        if (!user) {
            navigate('/auth');
            return;
        }

        setCurrentStep('generating');
        setIsThinking(true);
        setGenerationError(null);

        try {
            const personalityLabel = PERSONALITIES.find(p => p.id === personality)?.label || 'Mentor que encoraja';

            const content = await aiPlansService.generatePlanContent({
                title: theme.trim(),
                objective,
                situation,
                durationDays: finalDuration,
                intensity,
                formats,
                style,
                branchingAnswers: {
                    'Personalidade do guia': personalityLabel,
                    'Tempo diário': INTENSITY_LABEL[intensity],
                    'Estilo de escrita': STYLE_LABEL[style],
                    'Componentes': formats.map(f => FORMAT_LABEL[f]).join(', '),
                },
            });

            const planId = await aiPlansService.createPlan({
                userId: user.id,
                title: content.title,
                description: content.description,
                objective,
                situation,
                durationDays: finalDuration,
                intensity,
                formats,
                style,
                mode,
                privacy,
                branchingAnswers: {
                    'Personalidade do guia': personalityLabel,
                    'Tempo diário': INTENSITY_LABEL[intensity],
                },
                days: content.days,
            });

            setCreatedPlanId(planId);
            setCreatedTitle(content.title);
            setCreatedDescription(content.description);
            setCurrentStep('success');
        } catch (error: any) {
            console.error('Failed to generate plan:', error);
            setGenerationError(error?.message || 'Não foi possível gerar o plano agora.');
            setCurrentStep('success');
        } finally {
            setIsThinking(false);
        }
    };

    const stepsMap: Record<Step, { title: string; subtitle: string }> = {
        goal: {
            title: 'O que o seu coração busca?',
            subtitle: 'Descreva com suas palavras a situação que precisa de luz. Pode ser "estudar Romanos" ou "ansiedade antes de dormir".',
        },
        duration: {
            title: 'Por quanto tempo caminharemos?',
            subtitle: 'Escolha a duração da jornada ou escreva um número exato.',
        },
        intensity: {
            title: 'Quanto tempo por dia?',
            subtitle: 'Isso define a profundidade de cada dia e quanto a IA escreve.',
        },
        format: {
            title: 'O que cada dia deve ter?',
            subtitle: 'Escolha os componentes. Você pode combinar quantos quiser.',
        },
        style: {
            title: 'Como a IA deve falar com você?',
            subtitle: 'O estilo de escrita e a personalidade que vão te acompanhar no estudo.',
        },
        situation: {
            title: 'Existe alguma situação específica?',
            subtitle: 'Opcional, mas muda muito o plano: uma decisão, um luto, um conflito, um exame.',
        },
        share: {
            title: 'Quem caminha com você?',
            subtitle: 'Sozinho ou acompanhado, e quem pode ver o plano.',
        },
        generating: {
            title: 'Preparando sua jornada...',
            subtitle: 'A IA está escrevendo cada dia do seu plano.',
        },
        success: {
            title: 'Sua jornada está pronta.',
            subtitle: 'Um caminho único foi traçado para você.',
        },
    };

    const currentStepInfo = stepsMap[currentStep];

    const OptionRow = ({ selected, onClick, title, desc, icon: Icon }: {
        selected: boolean; onClick: () => void; title: string; desc: string; icon?: any;
    }) => (
        <button
            onClick={onClick}
            className={cn(
                'w-full p-6 border rounded-3xl flex items-center gap-5 group transition-all text-left',
                selected ? 'border-white bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/30'
            )}
        >
            {Icon && (
                <div className="p-3 bg-white/5 rounded-2xl text-white/ group-hover:text-white transition-colors shrink-0">
                    <Icon size={22} />
                </div>
            )}
            <div className="flex-1">
                <h4 className="text-lg font-bold font-serif">{title}</h4>
                <p className="text-white/ text-sm font-serif italic mt-1">{desc}</p>
            </div>
            {selected && <Check size={20} className="text-white shrink-0" />}
        </button>
    );

    const PrimaryButton = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full py-5 bg-white text-black rounded-2xl font-bold text-xs tracking-[0.3em] uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
        >
            {children}
        </button>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 'goal':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                        <input
                            type="text"
                            placeholder="Ex: Quero vencer a ansiedade e voltar a dormir tranquilo..."
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-white/20 pb-4 text-2xl md:text-3xl font-serif text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/ placeholder:italic"
                            autoFocus
                        />
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/ mb-3">Objetivo principal</p>
                            <div className="flex flex-wrap gap-2">
                                {OBJECTIVES.map(o => (
                                    <button
                                        key={o}
                                        onClick={() => setObjective(objective === o ? '' : o)}
                                        className={cn(
                                            'px-4 py-2 rounded-full border text-xs tracking-wide transition-colors',
                                            objective === o ? 'bg-white text-black border-white' : 'border-white/15 text-white/ hover:border-white/40 hover:text-white'
                                        )}
                                    >
                                        {o}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <PrimaryButton onClick={handleNext} disabled={!theme.trim()}>Continuar</PrimaryButton>
                    </motion.div>
                );

            case 'duration':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                        <div className="grid grid-cols-4 gap-3">
                            {DURATIONS.map(d => (
                                <button
                                    key={d}
                                    onClick={() => { setDuration(d); setCustomDuration(''); }}
                                    className={cn(
                                        'p-5 border rounded-2xl flex flex-col items-center justify-center text-center transition-all',
                                        !customDuration && duration === d ? 'border-white bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                                    )}
                                >
                                    <h4 className="text-2xl font-bold font-serif">{d}</h4>
                                    <p className="text-white/ text-[9px] font-black uppercase tracking-widest mt-1">Dias</p>
                                </button>
                            ))}
                        </div>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/ mb-3">Duração personalizada</p>
                            <input
                                type="number"
                                min={1}
                                max={365}
                                placeholder="Ex: 45"
                                value={customDuration}
                                onChange={(e) => setCustomDuration(e.target.value)}
                                className="w-full bg-transparent border-b border-white/20 pb-3 text-2xl font-serif text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/"
                            />
                        </div>
                        <PrimaryButton onClick={handleNext} disabled={finalDuration < 1}>Continuar</PrimaryButton>
                    </motion.div>
                );

            case 'intensity':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                        {INTENSITIES.map(i => (
                            <OptionRow
                                key={i.id}
                                selected={intensity === i.id}
                                onClick={() => setIntensity(i.id)}
                                title={i.label}
                                desc={i.desc}
                                icon={Clock}
                            />
                        ))}
                        <PrimaryButton onClick={handleNext}>Continuar</PrimaryButton>
                    </motion.div>
                );

            case 'format':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                        <div className="flex flex-wrap gap-3">
                            {FORMATS.map(f => {
                                const selected = formats.includes(f);
                                return (
                                    <button
                                        key={f}
                                        onClick={() => toggleFormat(f)}
                                        className={cn(
                                            'px-5 py-4 rounded-2xl border text-sm tracking-wide transition-all flex items-center gap-2',
                                            selected ? 'bg-white text-black border-white' : 'border-white/15 text-white/ hover:border-white/40 hover:text-white'
                                        )}
                                    >
                                        {selected && <Check size={16} />}
                                        {FORMAT_LABEL[f]}
                                    </button>
                                );
                            })}
                        </div>
                        <PrimaryButton onClick={handleNext} disabled={formats.length === 0}>Continuar</PrimaryButton>
                    </motion.div>
                );

            case 'style':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                        <div className="grid grid-cols-2 gap-3">
                            {STYLES.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setStyle(s.id)}
                                    className={cn(
                                        'p-5 border rounded-2xl text-left transition-all',
                                        style === s.id ? 'border-white bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                                    )}
                                >
                                    <h4 className="font-bold font-serif mb-1">{STYLE_LABEL[s.id]}</h4>
                                    <p className="text-white/ text-xs font-serif italic">{s.desc}</p>
                                </button>
                            ))}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/ mb-3">Personalidade do guia</p>
                            <div className="grid grid-cols-2 gap-3">
                                {PERSONALITIES.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setPersonality(p.id)}
                                        className={cn(
                                            'p-5 border rounded-2xl text-left transition-all',
                                            personality === p.id ? 'border-white bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                                        )}
                                    >
                                        <h4 className="font-bold font-serif text-sm mb-1">{p.label}</h4>
                                        <p className="text-white/ text-xs font-serif italic">{p.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <PrimaryButton onClick={handleNext}>Continuar</PrimaryButton>
                    </motion.div>
                );

            case 'situation':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                        <textarea
                            placeholder="Ex: estou passando por um divórcio, perdi o emprego e tenho dificuldade de perdoar meu pai..."
                            value={situation}
                            onChange={(e) => setSituation(e.target.value)}
                            rows={5}
                            className="w-full bg-transparent border-b-2 border-white/20 pb-4 text-xl font-serif text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/ placeholder:italic resize-none"
                            autoFocus
                        />
                        <PrimaryButton onClick={handleNext}>Continuar</PrimaryButton>
                    </motion.div>
                );

            case 'share':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                        <div className="space-y-3">
                            <OptionRow
                                selected={mode === 'individual'}
                                onClick={() => setMode('individual')}
                                title="Solo"
                                desc="Um plano só seu, no seu ritmo"
                                icon={BookOpen}
                            />
                            <OptionRow
                                selected={mode === 'grupo'}
                                onClick={() => setMode('grupo')}
                                title="Em grupo"
                                desc="Acompanhe o progresso de quem caminha com você"
                                icon={Users}
                            />
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/">Quem pode ver</p>
                            <OptionRow
                                selected={privacy === 'private'}
                                onClick={() => setPrivacy('private')}
                                title="Somente eu"
                                desc="Plano totalmente privado"
                                icon={Lock}
                            />
                            <OptionRow
                                selected={privacy === 'link'}
                                onClick={() => setPrivacy('link')}
                                title="Qualquer um com o link"
                                desc="Gera um link público para compartilhar"
                                icon={Globe2}
                            />
                            <OptionRow
                                selected={privacy === 'invite'}
                                onClick={() => setPrivacy('invite')}
                                title="Só com código de convite"
                                desc="Você distribui um código de 6 letras"
                                icon={Users}
                            />
                        </div>
                         <PrimaryButton onClick={generatePlan} disabled={isThinking}>
                             Criar meu plano
                         </PrimaryButton>
                     </motion.div>
                );

            case 'generating':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 space-y-10">
                        <Loading fullScreen={false} />
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={stageIndex}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="text-white/ font-serif italic text-lg text-center"
                            >
                                {GENERATING_STAGES[stageIndex]}
                            </motion.p>
                        </AnimatePresence>
                        <div className="h-1 bg-white/10 rounded-full w-56 overflow-hidden">
                            <motion.div
                                className="h-full bg-white"
                                initial={{ width: '5%' }}
                                animate={{ width: `${((stageIndex + 1) / GENERATING_STAGES.length) * 100}%` }}
                                transition={{ duration: 1.2 }}
                            />
                        </div>
                    </motion.div>
                );

            case 'success':
                if (generationError) {
                    return (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
                            <div className="w-24 h-24 border border-white/15 rounded-full flex items-center justify-center mx-auto">
                                <BookOpen size={40} className="text-white/" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif font-bold tracking-tight mb-4">A IA não respondeu agora</h2>
                                <p className="text-white/ font-serif italic text-base max-w-md mx-auto">{generationError}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={generatePlan}
                                    className="flex-1 py-5 bg-white text-black rounded-2xl font-bold text-xs tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors"
                                >
                                    Tentar novamente
                                </button>
                                <button
                                    onClick={() => navigate('/plans')}
                                    className="flex-1 py-5 border border-white/15 rounded-2xl font-bold text-xs tracking-[0.3em] uppercase text-white/ hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Voltar aos planos
                                </button>
                            </div>
                        </motion.div>
                    );
                }

                return (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-black">
                            <BookOpen size={40} />
                        </div>
                        <div>
                            <span className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-bold tracking-[0.3em] uppercase border border-white/10 text-white/ mb-6 inline-block">
                                {finalDuration} Dias • {INTENSITY_LABEL[intensity]}
                            </span>
                            <h2 className="text-4xl font-serif font-bold tracking-tight mb-4">{createdTitle}</h2>
                            <p className="text-white/ font-serif italic text-lg max-w-md mx-auto">{createdDescription}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => createdPlanId && navigate(`/plano/${createdPlanId}`)}
                                className="flex-1 py-5 bg-white text-black rounded-2xl font-bold text-xs tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors"
                            >
                                Começar o dia 1
                            </button>
                            <button
                                onClick={() => navigate('/plans')}
                                className="flex-1 py-5 border border-white/15 rounded-2xl font-bold text-xs tracking-[0.3em] uppercase text-white/ hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Meus planos
                            </button>
                        </div>
                    </motion.div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-serif relative overflow-hidden">
            <ParticleBackground />

            <header className="fixed top-0 left-0 right-0 p-6 md:p-12 z-50 flex justify-between items-center pointer-events-none">
                {isWizard ? (
                    <button onClick={handleBack} className="pointer-events-auto flex items-center gap-2 text-white/ hover:text-white transition-colors group">
                        <ArrowLeft size={20}  />
                        <span className="font-bold text-[10px] tracking-[0.3em] uppercase">Voltar</span>
                    </button>
                ) : <div />}

                <div className="flex items-center gap-3 opacity-30">
                    <img src={logo} alt="OneFlow" className="w-8 h-8 object-contain" />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase">OneFlow</span>
                </div>
            </header>

            <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-24">
                <div className="w-full max-w-xl">
                    {isWizard && (
                        <div className="mb-16">
                            <div className="flex items-center gap-2 mb-8">
                                <div className="h-1 bg-white/20 rounded-full flex-1 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-white"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((stepIndex + 1) / WIZARD_STEPS.length) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold tracking-[0.3em] text-white/ uppercase w-12 text-right">
                                    {stepIndex + 1}/{WIZARD_STEPS.length}
                                </span>
                            </div>

                            <motion.div key={currentStepInfo.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{currentStepInfo.title}</h1>
                                <p className="text-white/ text-base md:text-lg italic opacity-80">{currentStepInfo.subtitle}</p>
                            </motion.div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {renderStepContent()}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
