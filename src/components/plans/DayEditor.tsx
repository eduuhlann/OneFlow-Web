import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { AiPlanDay } from '../../services/features/aiPlansService';
import { cn } from './planUtils';

type Patch = Partial<Omit<AiPlanDay, 'id' | 'plan_id'>>;

const FIELDS: { key: keyof Patch; label: string; rows: number; placeholder: string }[] = [
    { key: 'title', label: 'Título', rows: 1, placeholder: 'Título do dia' },
    { key: 'reference', label: 'Referência bíblica', rows: 1, placeholder: 'João 3:16' },
    { key: 'content', label: 'Leitura', rows: 6, placeholder: 'Desenvolva a reflexão principal...' },
    { key: 'context', label: 'Contexto', rows: 3, placeholder: 'Contexto histórico ou literário...' },
    { key: 'prayer', label: 'Oração', rows: 4, placeholder: 'Escreva a oração do dia...' },
    { key: 'practice', label: 'Aplicação prática', rows: 3, placeholder: 'O que fazer hoje...' },
    { key: 'challenge', label: 'Desafio', rows: 2, placeholder: 'O desafio de hoje...' },
    { key: 'memorization', label: 'Memorização', rows: 2, placeholder: 'Versículo para decorar' },
];

export const DayEditor = ({ day, onSave, onCancel, saving }: {
    day: AiPlanDay;
    onSave: (patch: Patch) => void;
    onCancel: () => void;
    saving: boolean;
}) => {
    const [values, setValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        FIELDS.forEach(f => { initial[f.key as string] = (day[f.key as keyof AiPlanDay] as string) || ''; });
        return initial;
    });
    const [questions, setQuestions] = useState<string[]>(() => {
        const qs = Array.isArray(day.questions) ? day.questions : [];
        return qs.length ? qs.map((q: any) => (typeof q === 'string' ? q : q.question || '')) : [''];
    });

    const set = (key: string, value: string) => setValues(prev => ({ ...prev, [key]: value }));

    const handleSave = () => {
        const patch: Record<string, any> = {};
        FIELDS.forEach(f => {
            const key = f.key as string;
            if (values[key] !== (day as any)[key]) patch[key] = values[key];
        });
        const cleaned = questions.map(q => q.trim()).filter(Boolean);
        if (cleaned.length) patch.questions = cleaned.map(q => ({ question: q }));

        if (Object.keys(patch).length === 0) {
            onCancel();
            return;
        }
        onSave(patch as Patch);
    };

    const inputClass = 'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-serif text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none';

    return (
        <div className="space-y-8">
            <div className="space-y-5">
                {FIELDS.map(f => (
                    <label key={f.key as string} className="block space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">{f.label}</span>
                        <textarea
                            rows={f.rows}
                            value={values[f.key as string] || ''}
                            placeholder={f.placeholder}
                            onChange={(e) => set(f.key as string, e.target.value)}
                            className={inputClass}
                        />
                    </label>
                ))}
            </div>

            <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Perguntas</span>
                {questions.map((q, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            value={q}
                            onChange={(e) => setQuestions(prev => prev.map((p, idx) => (idx === i ? e.target.value : p)))}
                            placeholder="Pergunta de aplicação"
                            className={inputClass}
                        />
                        <button
                            onClick={() => setQuestions(prev => prev.filter((_, idx) => idx !== i))}
                            className="px-3 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:border-white/30 transition-colors shrink-0"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => setQuestions(prev => [...prev, ''])}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
                >
                    <Plus size={14} /> Adicionar pergunta
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        'flex-1 py-5 bg-white text-black rounded-2xl font-bold text-xs tracking-[0.3em] uppercase',
                        'hover:bg-gray-200 transition-colors disabled:opacity-50'
                    )}
                >
                    {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 py-5 border border-white/15 rounded-2xl font-bold text-xs tracking-[0.3em] uppercase text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <span className="flex items-center justify-center gap-2"><Check size={14} /> Cancelar</span>
                </button>
            </div>
        </div>
    );
};
