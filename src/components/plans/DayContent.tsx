import React from 'react';
import { BookOpen, Compass, Flame, Hand, MessageCircleQuestion, Quote, ScrollText, Target } from 'lucide-react';
import type { AiPlanDay } from '../../services/features/aiPlansService';
import { cn } from './planUtils';

const Section = ({ icon: Icon, title, children, className }: {
    icon: any; title: string; children: React.ReactNode; className?: string;
}) => (
    <section className={cn('space-y-3', className)}>
        <div className="flex items-center gap-3 text-white/">
            <Icon size={16} />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">{title}</h3>
        </div>
        {children}
    </section>
);

export const DayContent = ({ day }: { day: AiPlanDay }) => {
    const questions = Array.isArray(day.questions) ? day.questions : [];

    return (
        <article className="space-y-10">
            <header className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/">Dia {day.day}</span>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">{day.title}</h1>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    {day.reference && (
                        <span className="px-4 py-2 rounded-full border border-white/15 text-white/70 text-xs tracking-wider">
                            {day.reference}
                        </span>
                    )}
                    <span className="px-4 py-2 rounded-full border border-white/10 text-white/ text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
                        <Flame size={12} />
                        {['Leve', 'Médio', 'Profundo'][Math.min(2, Math.max(0, (day.difficulty || 1) - 1))]}
                        {day.version > 1 && ` · v${day.version}`}
                    </span>
                </div>
            </header>

            {day.content && (
                <Section icon={BookOpen} title="Leitura">
                    <p className="text-lg md:text-xl leading-[1.9] text-white/85 font-serif">{day.content}</p>
                </Section>
            )}

            {day.context && (
                <Section icon={Compass} title="Contexto">
                    <p className="text-base leading-relaxed text-white/ font-serif italic">{day.context}</p>
                </Section>
            )}

            {day.prayer && (
                <Section icon={Quote} title="Oração">
                    <p className="text-lg leading-[1.9] text-white/80 font-serif italic border-l border-white/20 pl-5">{day.prayer}</p>
                </Section>
            )}

            {day.practice && (
                <Section icon={Hand} title="Aplicação prática">
                    <p className="text-base leading-relaxed text-white/75 font-serif">{day.practice}</p>
                </Section>
            )}

            {day.challenge && (
                <Section icon={Target} title="Desafio do dia">
                    <p className="text-base leading-relaxed text-white/75 font-serif">{day.challenge}</p>
                </Section>
            )}

            {day.memorization && day.memorization !== 'n/a' && (
                <Section icon={ScrollText} title="Memorize">
                    <p className="text-base leading-relaxed text-white/80 font-serif">{day.memorization}</p>
                </Section>
            )}

            {questions.length > 0 && (
                <Section icon={MessageCircleQuestion} title="Perguntas">
                    <ol className="space-y-4">
                        {questions.map((q: any, i: number) => (
                            <li key={i} className="flex gap-4">
                                <span className="text-white/ font-serif">{String(i + 1).padStart(2, '0')}</span>
                                <p className="text-base leading-relaxed text-white/75 font-serif">
                                    {typeof q === 'string' ? q : q.question}
                                </p>
                            </li>
                        ))}
                    </ol>
                </Section>
            )}
        </article>
    );
};
