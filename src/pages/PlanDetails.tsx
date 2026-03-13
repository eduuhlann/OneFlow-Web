import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, Circle, BookOpen, Clock, Calendar } from 'lucide-react';
import { plansService, STATIC_PLANS, Plan, UserPlan } from '../services/features/plansService';
import ParticleBackground from '../components/ParticleBackground';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function PlanDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [plan, setPlan] = useState<Plan | null>(null);
    const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        loadPlanData();
    }, [id]);

    const loadPlanData = () => {
        if (!id) return;
        
        const activePlans = plansService.getActivePlans();
        const active = activePlans.find(p => p.planId === id);
        
        const customPlans = plansService.getCustomPlans();
        const targetPlan = STATIC_PLANS.find(p => p.id === id) || customPlans.find(p => p.id === id);
        
        if (targetPlan && active) {
            setPlan(targetPlan);
            setUserPlan(active);
            setProgress(plansService.getPlanProgress(id));
        } else {
            // Plan not found or not active
            navigate('/plans');
        }
    };

    const toggleDay = (day: number) => {
        if (!id) return;
        
        // This simulates toggling a day. In the real app, we need an add/remove day logic.
        // For now, we just mark it complete using existing service.
        plansService.markDayComplete(id, day);
        loadPlanData();
    };

    if (!plan || !userPlan) {
        return <div className="min-h-screen bg-black" />;
    }

    return (
        <div className="min-h-screen bg-black text-white font-serif relative overflow-hidden selection:bg-white selection:text-black">
            <ParticleBackground />
            
            <header className="fixed top-0 left-0 right-0 p-6 md:p-12 z-50 flex justify-between items-center pointer-events-none">
                <button 
                    onClick={() => navigate('/plans')} 
                    className="pointer-events-auto flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-[10px] tracking-[0.3em] uppercase sans">Voltar</span>
                </button>
            </header>

            <main className="relative z-10 max-w-3xl mx-auto pt-32 pb-24 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16 text-center"
                >
                    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white">
                        <BookOpen size={32} />
                    </div>
                    <span className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold tracking-[0.3em] uppercase border border-white/10 text-white/40 mb-6 inline-block sans">
                        {plan.category === 'ai' ? 'Plano IA' : 'Plano Padrão'} • {plan.durationDays} Dias
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{plan.title}</h1>
                    <p className="text-white/40 text-lg italic opacity-80 max-w-lg mx-auto leading-relaxed">
                        {plan.description}
                    </p>
                </motion.div>

                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold tracking-[0.3em] uppercase text-white/40 sans">Progresso da Jornada</h3>
                        <span className="text-2xl font-black italic">{progress}%</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-white rounded-full"
                        />
                    </div>
                    <p className="text-center text-white/30 text-xs italic mt-6">
                        {userPlan.completedDays.length} de {plan.durationDays} dias concluídos
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40 sans mb-8 flex items-center gap-4">
                        Dias do Plano
                        <div className="flex-1 h-px bg-white/5" />
                    </h3>

                    {Array.from({ length: plan.durationDays }).map((_, i) => {
                        const dayNumber = i + 1;
                        const isCompleted = userPlan.completedDays.includes(dayNumber);
                        const dayContent = plan.content?.find(c => c.day === dayNumber);
                        
                        return (
                            <motion.div
                                key={dayNumber}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(i * 0.05, 0.5) }}
                                className={cn(
                                    "w-full p-6 md:p-8 bg-white/5 border rounded-3xl transition-all",
                                    isCompleted 
                                        ? "border-white/20 bg-white/10 opacity-75" 
                                        : "border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                                )}
                            >
                                <div className="flex items-start gap-6 mb-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                                        isCompleted ? "bg-white text-black" : "bg-white/5 text-white/20"
                                    )}>
                                        {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                    </div>
                                    <div className="flex-1 mt-1">
                                        <h4 className="text-xl font-bold mb-1">Dia {dayNumber} {dayContent ? `- ${dayContent.title}` : ''}</h4>
                                        <p className="text-white/40 text-sm font-bold tracking-widest uppercase sans mb-4">
                                            {dayContent ? dayContent.verse : (isCompleted ? "Concluído" : "Pendente")}
                                        </p>
                                        
                                        {dayContent && (
                                            <div className="prose prose-invert max-w-none text-white/80 italic text-lg leading-relaxed border-l-2 border-white/20 pl-6 my-6">
                                                <p>"{dayContent.content}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => toggleDay(dayNumber)}
                                    disabled={isCompleted}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-bold text-xs tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-2",
                                        isCompleted
                                            ? "bg-transparent border border-white/20 text-white/40 cursor-not-allowed"
                                            : "bg-white text-black hover:bg-gray-200"
                                    )}
                                >
                                    {isCompleted ? (
                                        <>Dia Concluído <CheckCircle2 size={16} /></>
                                    ) : (
                                        <>Concluir Leitura</>
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
