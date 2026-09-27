import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Check, Quote, Search, X } from 'lucide-react';
import { FEATURED_VERSES, formatVerse, searchVerses, type FeaturedVerse } from '../data/featuredVerses';

interface FeaturedVersePickerProps {
    value: string;
    onChange: (value: string) => void;
}

/**
 * Seletor do versículo fixado no perfil (#4).
 * O valor salvo é a string "Referência — texto".
 */
export const FeaturedVersePicker: React.FC<FeaturedVersePickerProps> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const results = useMemo(() => searchVerses(query, 8), [query]);
    const selected = useMemo(
        () => FEATURED_VERSES.find((v) => formatVerse(v) === value) || null,
        [value]
    );

    const pick = (verse: FeaturedVerse) => {
        onChange(formatVerse(verse));
        setOpen(false);
        setQuery('');
    };

    return (
        <div className="space-y-3">
            {value && (
                <div className="relative p-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06]">
                    <Quote size={16} className="text-amber-300/60 mb-2" />
                    <p className="font-serif text-sm text-amber-50/90 leading-relaxed">{value}</p>
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-white/ hover:text-white hover:bg-white/10 transition-colors"
                        title="Remover versículo"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 py-3.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/ hover:border-white/30 hover:text-white transition-all"
                >
                    <BookOpen size={14} />
                    {value ? 'Trocar versículo' : 'Escolher versículo do perfil'}
                </button>
            ) : (
                <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                        <Search size={14} className="text-white/" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por referência, tema ou palavra..."
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/ focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => { setOpen(false); setQuery(''); }}
                            className="p-1 rounded-lg text-white/ hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {results.length === 0 ? (
                            <p className="px-4 py-6 text-center text-xs text-white/">
                                Nenhum versículo encontrado.
                            </p>
                        ) : (
                            results.map((verse) => (
                                <button
                                    key={verse.id}
                                    type="button"
                                    onClick={() => pick(verse)}
                                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/[0.04] last:border-0"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300/80">
                                            {verse.reference}
                                        </span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/">
                                            {verse.theme}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-white/ line-clamp-2">{verse.text}</p>
                                </button>
                            ))
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => { onChange(''); setOpen(false); }}
                        className="w-full py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/ hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Limpar seleção
                    </button>
                </div>
            )}

            <AnimatePresence>
                {selected && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-[10px] text-white/"
                    >
                        <Check size={11} className="text-emerald-400" />
                        Aparece no topo do seu perfil público.
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FeaturedVersePicker;
