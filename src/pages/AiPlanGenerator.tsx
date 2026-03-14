import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Clock, BookOpen, Sun, Moon, Sunrise, Bell } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { plansService } from '../services/features/plansService';
import { callGroqChat } from '../services/ai/groqService';
import logo from '../assets/logo.png';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Step = 'theme' | 'testament' | 'period' | 'notification' | 'generating' | 'success';

interface PlanConfig {
    theme: string;
    testament: string;
    period: string;
    notificationTime: string;
}

export default function AiPlanGenerator() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile } = useProfile();
    const displayName = profile?.username || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'irmão';

    const [currentStep, setCurrentStep] = useState<Step>('theme');
    const [config, setConfig] = useState<PlanConfig>({
        theme: '',
        testament: '',
        period: '',
        notificationTime: '08:00'
    });
    
    const [generatedTitle, setGeneratedTitle] = useState('');
    const [generatedDescription, setGeneratedDescription] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleNext = () => {
        if (currentStep === 'theme' && config.theme.trim()) setCurrentStep('testament');
        else if (currentStep === 'testament' && config.testament) setCurrentStep('period');
        else if (currentStep === 'period' && config.period) setCurrentStep('notification');
        else if (currentStep === 'notification') generatePlan();
    };

    const handleBack = () => {
        if (currentStep === 'testament') setCurrentStep('theme');
        else if (currentStep === 'period') setCurrentStep('testament');
        else if (currentStep === 'notification') setCurrentStep('period');
        else if (currentStep === 'theme') navigate('/plans');
    };

    const generatePlan = async () => {
        setCurrentStep('generating');
        setIsThinking(true);

        try {
            const systemPrompt = `Você é Olyviah, assistente do aplicativo cristão OneFlow. 
            Crie um plano de leitura bíblica de exatos 7 DIAS.
            Tema: ${config.theme}
            Testamento: ${config.testament}

            VOCÊ DEVE RETORNAR APENAS UM JSON VÁLIDO. NÃO INCLUA NENHUM TEXTO ANTES OU DEPOIS DO JSON.
            O formato JSON DEVE ser exatamente este:
            {
                "title": "título curto (até 5 palavras)",
                "description": "descrição curta (até 15 palavras)",
                "days": [
                    { "day": 1, "title": "título do dia", "verse": "Referência Bíblica (ex: João 3:16)", "content": "reflexão curta (até 30 palavras)" },
                    ... repita até o day 7
                ]
            }`;

            const response = await callGroqChat([{ role: 'system', content: systemPrompt }]);
            
            let parsedData;
            try {
                // Priority 1: Clean JSON parse
                parsedData = JSON.parse(response);
            } catch (e) {
                try {
                    // Priority 2: Extract JSON from markdown blocks or generic {} matches
                    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                    } else {
                        throw new Error("No JSON match found");
                    }
                } catch (parseError) {
                    console.error("Failed to parse AI JSON:", parseError);
                    throw new Error("Invalid output format from AI");
                }
            }

            setGeneratedTitle(parsedData.title || `Jornada sobre ${config.theme}`);
            setGeneratedDescription(parsedData.description || `Um plano focado em ${config.theme}.`);

            const newPlanId = `custom-${Date.now()}`;
            
            plansService.saveCustomPlan({
                id: newPlanId,
                title: parsedData.title,
                description: parsedData.description,
                durationDays: 7, 
                category: 'ai',
                content: parsedData.days
            });

            plansService.joinPlan(newPlanId);

            setCurrentStep('success');
        } catch (error) {
            console.error("Failed to generate plan:", error);
            // Fallback plan
            setGeneratedTitle(`Trilha: ${config.theme}`);
            setGeneratedDescription(`Um plano personalizado focado em ${config.theme.toLowerCase()}. A geração avançada com leitura diária falhou.`);
            
            const newPlanId = `custom-${Date.now()}`;
            plansService.saveCustomPlan({
                id: newPlanId,
                title: `Trilha: ${config.theme}`,
                description: `Um plano personalizado focado em ${config.theme.toLowerCase()}.`,
                durationDays: 7,
                category: 'ai',
                content: Array.from({ length: 7 }).map((_, i) => ({
                    day: i + 1,
                    title: `Reflexão Diária ${i + 1}`,
                    verse: 'Salmos 119:105',
                    content: 'Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.'
                }))
            });
            plansService.joinPlan(newPlanId);

            setCurrentStep('success');
        } finally {
            setIsThinking(false);
        }
    };

    const stepsMap: Record<Step, { title: string; subtitle: string }> = {
        theme: {
            title: "O que o seu coração busca?",
            subtitle: "Descreva o tema ou área da sua vida que precisa de luz (ex: Ansiedade, Liderança, Paz)."
        },
        testament: {
            title: "Onde começamos?",
            subtitle: "Escolha de onde extrairemos a sabedoria para sua jornada."
        },
        period: {
            title: "Qual o seu momento de paz?",
            subtitle: "Em qual parte do dia você prefere realizar suas leituras e reflexões?"
        },
        notification: {
            title: "Quando devo te chamar?",
            subtitle: "Defina um horário para Olyviah te lembrar do seu compromisso."
        },
        generating: {
            title: "Olyviah está orando por você...",
            subtitle: "Preparando sua jornada espiritual personalizada."
        },
        success: {
            title: "Sua jornada está pronta.",
            subtitle: "Um caminho único foi traçado para você."
        }
    };

    const currentStepInfo = stepsMap[currentStep];

    const renderStepContent = () => {
        switch (currentStep) {
            case 'theme':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <input
                            type="text"
                            placeholder="Ex: Confiança num futuro incerto..."
                            value={config.theme}
                            onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                            className="w-full bg-transparent border-b-2 border-white/20 pb-4 text-3xl font-serif text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/20 placeholder:italic"
                            autoFocus
                        />
                        <button
                            onClick={handleNext}
                            disabled={!config.theme.trim()}
                            className="w-full py-5 bg-white text-black rounded-2xl font-bold text-xs tracking-[0.3em] uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                        >
                            Continuar
                        </button>
                    </motion.div>
                );

            case 'testament':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {[
                            { id: 'Antigo Testamento', icon: BookOpen, desc: 'História, Leis e Profetas' },
                            { id: 'Novo Testamento', icon: Sparkles, desc: 'Vida de Cristo e Apóstolos' },
                            { id: 'Ambos', icon: BookOpen, desc: 'Toda a Escritura' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setConfig({ ...config, testament: t.id });
                                    setCurrentStep('period'); // Auto advance
                                }}
                                className={cn(
                                    "w-full p-6 bg-white/5 border rounded-3xl flex items-center gap-6 group transition-all text-left",
                                    config.testament === t.id ? "border-white bg-white/10" : "border-white/10 hover:border-white/30"
                                )}
                            >
                                <div className="p-4 bg-white/5 rounded-2xl text-white/50 group-hover:text-white transition-colors">
                                    <t.icon size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold font-serif">{t.id}</h4>
                                    <p className="text-white/40 text-sm font-serif italic mt-1">{t.desc}</p>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                );

            case 'period':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        {[
                            { id: 'Manhã', icon: Sunrise, desc: 'Comece com Deus' },
                            { id: 'Tarde', icon: Sun, desc: 'Pausa no dia' },
                            { id: 'Noite', icon: Moon, desc: 'Reflexão diária' }
                        ].map(p => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setConfig({ ...config, period: p.id });
                                    setCurrentStep('notification'); // Auto advance
                                }}
                                className={cn(
                                    "p-8 bg-white/5 border rounded-3xl flex flex-col items-center justify-center text-center group transition-all",
                                    config.period === p.id ? "border-white bg-white/10" : "border-white/10 hover:border-white/30"
                                )}
                            >
                                <div className="p-4 bg-white/5 rounded-full text-white/50 group-hover:text-white transition-colors mb-6">
                                    <p.icon size={32} />
                                </div>
                                <h4 className="text-xl font-bold font-serif mb-2">{p.id}</h4>
                                <p className="text-white/40 text-xs font-serif italic">{p.desc}</p>
                            </button>
                        ))}
                    </motion.div>
                );

            case 'notification':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-12"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-8 relative">
                                <Bell size={32} className="text-white/40" />
                                <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-white border-4 border-black animate-pulse" />
                            </div>
                            <input
                                type="time"
                                value={config.notificationTime}
                                onChange={(e) => setConfig({ ...config, notificationTime: e.target.value })}
                                className="bg-transparent text-5xl font-serif text-white outline-none text-center border-b border-white/20 pb-4 focus:border-white transition-colors"
                            />
                        </div>
                        <button
                            onClick={handleNext}
                            className="w-full py-5 bg-white text-black rounded-2xl font-bold text-xs tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
                        >
                            <Sparkles size={16} /> Gerar Meu Plano
                        </button>
                    </motion.div>
                );

            case 'generating':
                return (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <div className="w-24 h-24 bg-white/[0.03] border border-white/10 rounded-full flex items-center justify-center mb-8 relative overflow-hidden group">
                           <img src={logo} alt="Olyviah" className="w-12 h-12 object-contain grayscale opacity-60 mix-blend-screen" />
                           <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rotate-180 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                        </div>
                    </motion.div>
                );

            case 'success':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-black mb-8">
                            <BookOpen size={40} />
                        </div>
                        <div>
                            <span className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-bold tracking-[0.3em] uppercase border border-white/10 text-white/60 mb-6 inline-block">
                                Plano 7 Dias • {config.period}
                            </span>
                            <h2 className="text-4xl font-serif font-bold tracking-tight mb-4">{generatedTitle}</h2>
                            <p className="text-white/60 font-serif italic text-lg max-w-md mx-auto">{generatedDescription}</p>
                        </div>
                        <button
                            onClick={() => navigate('/plans')}
                            className="w-full py-5 bg-white text-black rounded-2xl font-bold text-xs tracking-[0.3em] uppercase hover:bg-gray-200 transition-colors mt-8"
                        >
                            Ver Meu Plano
                        </button>
                    </motion.div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-serif relative overflow-hidden">
            <ParticleBackground />
            
            <header className="fixed top-0 left-0 right-0 p-6 md:p-12 z-50 flex justify-between items-center pointer-events-none">
                {currentStep !== 'generating' && currentStep !== 'success' ? (
                    <button 
                        onClick={handleBack} 
                        className="pointer-events-auto flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-[10px] tracking-[0.3em] uppercase">Voltar</span>
                    </button>
                ) : <div />}
                
                <div className="flex items-center gap-3 opacity-30">
                    <img src={logo} alt="OneFlow" className="w-8 h-8 object-contain" />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Olyviah</span>
                </div>
            </header>

            <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-24">
                <div className="w-full max-w-xl">
                    
                    {currentStep !== 'generating' && currentStep !== 'success' && (
                        <div className="mb-16">
                            <div className="flex items-center gap-2 mb-8">
                                <div className="h-1 bg-white/20 rounded-full flex-1 overflow-hidden">
                                     <motion.div 
                                        className="h-full bg-white"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(['theme', 'testament', 'period', 'notification'].indexOf(currentStep) + 1) * 25}%` }}
                                     />
                                </div>
                                <span className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase w-12 text-right">
                                    {['theme', 'testament', 'period', 'notification'].indexOf(currentStep) + 1}/4
                                </span>
                            </div>

                            <motion.div
                                key={currentStepInfo.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                    {currentStepInfo.title}
                                </h1>
                                <p className="text-white/40 text-lg italic opacity-80">
                                    {currentStepInfo.subtitle}
                                </p>
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
