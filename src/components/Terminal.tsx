import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconTerminal2, IconX } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';

interface TerminalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CommandOutput {
    type: 'input' | 'output' | 'error' | 'system';
    content: string | React.ReactNode;
}

export const Terminal: React.FC<TerminalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { profile } = useProfile();
    const [history, setHistory] = useState<CommandOutput[]>([
        { type: 'system', content: 'OneFlow [Versão 1.0.4]' },
        { type: 'system', content: '(c) OneFlow Corporation. Todos os direitos reservados.' },
        { type: 'system', content: 'Digite "ajuda" para ver os comandos disponíveis.' },
    ]);
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const displayName = profile?.username || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'usuario';

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleCommand = (cmd: string) => {
        const trimmedCmd = cmd.trim().toLowerCase();
        if (!trimmedCmd) return;

        setCommandHistory(prev => [cmd, ...prev]);
        setHistoryIndex(-1);

        const newHistory: CommandOutput[] = [...history, { type: 'input', content: `${displayName}@oneflow:~$ ${cmd}` }];

        switch (trimmedCmd) {
            case 'ajuda':
                newHistory.push({
                    type: 'output',
                    content: (
                        <div className="grid grid-cols-1 gap-1 mt-2">
                            <div className="text-white font-bold underline uppercase tracking-tighter">Comandos disponíveis:</div>
                            <div className="grid grid-cols-[110px_1fr] gap-2">
                                <span className="text-white font-bold">ajuda</span> <span>- Mostra esta ajuda</span>
                                <span className="text-white font-bold">oneflow</span> <span>- O que é o projeto OneFlow?</span>
                                <span className="text-white font-bold">quem_sou</span> <span>- Informações do perfil atual</span>
                                <span className="text-white font-bold">listar</span> <span>- Lista módulos do projeto</span>
                                <span className="text-white font-bold">limpar</span> <span>- Limpa a tela do terminal</span>
                                <span className="text-white font-bold">sair</span> <span>- Fecha o terminal</span>
                            </div>
                        </div>
                    )
                });
                break;
            case 'oneflow':
                newHistory.push({
                    type: 'output',
                    content: (
                        <div className="space-y-2 mt-2 max-w-xl">
                            <p className="text-white font-bold uppercase tracking-widest text-xs border-b border-white/20 pb-1 w-fit">O que é o OneFlow?</p>
                            <p className="leading-relaxed">
                                OneFlow é uma plataforma digital projetada para simplificar e enriquecer a sua <span className="text-white font-bold">jornada espiritual</span>. 
                                Através de ferramentas inteligentes e design minimalista, ajudamos você a se conectar com a Bíblia, 
                                gerenciar planos de estudo e manter sua vida de oração ativa.
                            </p>
                            <p className="text-white/40 text-[10px] italic">"Fluxo constante de crescimento em cada passo da sua fé."</p>
                        </div>
                    )
                });
                break;
            case 'quem_sou':
                newHistory.push({
                    type: 'output',
                    content: (
                        <div className="space-y-1 mt-2">
                            <div><span className="text-white font-bold opacity-40">USUÁRIO:</span> {displayName}</div>
                            <div><span className="text-white font-bold opacity-40">ID:</span> {user?.id || 'anônimo'}</div>
                            <div><span className="text-white font-bold opacity-40">EMAIL:</span> {user?.email}</div>
                        </div>
                    )
                });
                break;
            case 'listar':
                newHistory.push({
                    type: 'output',
                    content: (
                        <div className="flex flex-wrap gap-4 mt-2">
                            <span className="text-white font-bold underline">biblia/</span>
                            <span className="text-white font-bold underline">discipulado/</span>
                            <span className="text-white font-bold underline">jornada/</span>
                            <span className="text-white font-bold underline">planos/</span>
                            <span className="text-white font-bold underline">oracao/</span>
                            <span className="text-white font-bold underline">configuracoes/</span>
                        </div>
                    )
                });
                break;
            case 'limpar':
                setHistory([{ type: 'system', content: 'Console limpo.' }]);
                return;
            case 'sair':
                onClose();
                return;
            default:
                newHistory.push({ type: 'error', content: `sh: comando não encontrado: ${cmd}` });
                break;
        }

        setHistory(newHistory);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCommand(input);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput('');
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-20"
                >
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Terminal Window */}
                    <motion.div
                        className="relative w-full max-w-4xl h-full max-h-[600px] bg-black/90 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(255,255,255,0.05)] flex flex-col font-mono text-sm group"
                        onClick={(e) => {
                            e.stopPropagation();
                            inputRef.current?.focus();
                        }}
                    >
                        {/* Scanlines Effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01),rgba(255,255,255,0.02))] bg-[length:100%_4px,3px_100%]" />
                        
                        {/* CR Glow */}
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] z-20" />

                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-white/10" />
                                    <div className="w-3 h-3 rounded-full bg-white/10" />
                                    <div className="w-3 h-3 rounded-full bg-white/10" />
                                </div>
                                <div className="flex items-center gap-2 text-white/40 uppercase text-[10px] font-bold tracking-widest ml-2">
                                    <IconTerminal2 size={14} className="text-white/60" />
                                    ONEFLOW_TERMINAL.EXE
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
                                    <IconX size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-2 text-white/80 relative z-30 selection:bg-white/20"
                        >
                            {history.map((line, idx) => (
                                <div 
                                    key={idx} 
                                    className={line.type === 'error' ? 'text-white font-bold line-through' : line.type === 'system' ? 'text-white/40 italic text-xs' : ''}
                                >
                                    {line.content}
                                </div>
                            ))}

                            {/* Prompt */}
                            <div className="flex items-center gap-2 group/input">
                                <span className="text-white font-bold opacity-60 shrink-0">{displayName}@oneflow:~$</span>
                                <div className="relative flex-1">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-white caret-white"
                                        autoFocus
                                    />
                                    {input === '' && (
                                        <motion.div
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                            className="absolute left-0 top-0 w-2 h-4 bg-white/40"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="px-4 py-2 bg-white/5 border-t border-white/10 text-[9px] text-white/10 uppercase tracking-widest flex justify-between shrink-0">
                            <span>Status: Operational</span>
                            <span>Region: Brazil</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
