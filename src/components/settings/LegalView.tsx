import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, FileText, ShieldCheck, ChevronRight, Scale } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const LegalView: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'main' | 'terms' | 'privacy'>('main');

    const sections = [
        { 
            id: 'terms', 
            title: 'Termos de Uso', 
            icon: FileText, 
            content: `Estes Termos de Uso regem o seu acesso e uso do OneFlow. Ao utilizar o aplicativo, você concorda com estas diretrizes.

1. Uso do Serviço: O OneFlow é destinado ao estudo bíblico pessoal e meditação.
2. Propriedade Intelectual: Todo o design e algoritmos proprietários são de propriedade da OneFlow Inc.
3. Conduta do Usuário: Você se compromete a não utilizar o serviço para fins ilícitos.`
        },
        { 
            id: 'privacy', 
            title: 'Política de Privacidade', 
            icon: ShieldCheck, 
            content: `Sua privacidade é nossa prioridade absoluta. No OneFlow, aplicamos o princípio de minimização de dados.

1. Coleta de Dados: Coletamos apenas informações essenciais para o funcionamento da conta (e-mail e nome).
2. Proteção: Utilizamos criptografia de ponta a ponta para seus registros de oração e progresso de leitura.
3. Compartilhamento: Nunca vendemos ou compartilhamos seus dados com terceiros.`
        }
    ];

    return (
        <div className="space-y-12">
            <AnimatePresence mode="wait">
                {activeSection === 'main' ? (
                    <motion.div
                        key="main-legal"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-12"
                    >
                        <div>
                            <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase block mb-2">Legal & Transparência</span>
                            <h2 className="text-3xl font-black italic -rotate-1 tracking-tighter">Termos e Privacidade</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id as any)}
                                    className="p-10 bg-white/5 border border-white/10 rounded-[3rem] flex items-center justify-between group hover:bg-white/10 transition-all text-left"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                                            <section.icon size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-black italic tracking-tighter text-2xl mb-1">{section.title}</h4>
                                            <p className="text-white/30 text-xs font-medium tracking-wide italic">Última atualização: Março 2024</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={24} className="text-white/10 group-hover:text-white transition-colors" />
                                </button>
                            ))}

                            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] flex items-center gap-8">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20">
                                    <Scale size={28} />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[8px] font-bold tracking-[0.3em] text-white/20 uppercase block mb-1">Conformidade Global</span>
                                    <p className="text-white/40 text-[10px] font-medium leading-relaxed italic">
                                        O OneFlow opera em conformidade com as principais regulamentações de proteção de dados (LGPD e GDPR).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content-legal"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-12"
                    >
                        <button 
                            onClick={() => setActiveSection('main')}
                            className="flex items-center gap-2 text-[10px] font-black tracking-widest text-white/40 uppercase hover:text-white transition-colors"
                        >
                            <ChevronRight size={14} className="rotate-180" /> VOLTAR PARA LEGAL
                        </button>

                        <div className="space-y-8">
                            <h2 className="text-4xl font-black italic -rotate-1 tracking-tighter">
                                {sections.find(s => s.id === activeSection)?.title}
                            </h2>
                            
                            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] prose prose-invert max-w-none">
                                <p className="text-white/60 font-medium text-lg leading-relaxed whitespace-pre-wrap italic">
                                    {sections.find(s => s.id === activeSection)?.content}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LegalView;
