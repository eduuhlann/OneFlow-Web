import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, BookOpen } from 'lucide-react';
import { chatStorage, ChatMessage } from '../../services/ai/chatStorage';
import { callGroqChat } from '../../services/ai/groqService';
import { AnimatedMessage } from '../AnimatedMessage';
import logo from '../../assets/logo.png';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface OlyviahExegesisPanelProps {
    isOpen: boolean;
    onClose: () => void;
    book: string;
    chapter: number;
    verseNumber: number;
    verseText: string;
    aiAvatar?: string | null;
}

export const OlyviahExegesisPanel: React.FC<OlyviahExegesisPanelProps> = ({
    isOpen,
    onClose,
    book,
    chapter,
    verseNumber,
    verseText,
    aiAvatar
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [threadId, setThreadId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && verseText) {
            initiateExegesis();
        } else {
            setMessages([]);
            setThreadId(null);
        }
    }, [isOpen, verseText, book, chapter, verseNumber]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const initiateExegesis = async () => {
        // Create a unique thread for this specific verse so it doesn't clutter the main chat
        const id = await chatStorage.createThread(`Estudo: ${book} ${chapter}:${verseNumber}`);
        setThreadId(id);
        
        setIsTyping(true);
        setTimeout(() => {
            const initialPrompt = `Você está lendo ${book} ${chapter}:${verseNumber}.\n\n"${verseText}"\n\nQual parte deste versículo chama mais sua atenção ou parece difícil de compreender?`;
            
            const aiMessage: ChatMessage = {
                id: Math.random().toString(36).substring(7),
                role: 'assistant',
                content: initialPrompt,
                timestamp: Date.now(),
            };
            setMessages([aiMessage]);
            chatStorage.saveMessage(id, aiMessage);
            setIsTyping(false);
        }, 1000);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isTyping || !threadId) return;

        const userMsg = input.trim();
        setInput('');

        const userMessage: ChatMessage = {
            id: Math.random().toString(36).substring(7),
            role: 'user',
            content: userMsg,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        await chatStorage.saveMessage(threadId, userMessage);
        
        setIsTyping(true);

        try {
            const history = messages.slice(-5).map(m => ({
                role: m.role === 'user' ? 'user' : 'model' as 'user' | 'model',
                content: m.content
            }));
            history.push({ role: 'user', content: userMsg });

            const systemPrompt = `Você é Olyviah, uma mentora espiritual profunda e exegética.
O usuário está estudando o versículo: "${verseText}" (${book} ${chapter}:${verseNumber}).

INSTRUÇÕES CRÍTICAS PARA ESTA INTERAÇÃO:
1. NÃO DÊ A RESPOSTA PRONTA IMEDIATAMENTE.
2. Seja socrática: faça perguntas que façam o usuário pensar sobre o texto.
3. Se apropriado, traga o significado original das palavras em Hebraico/Grego relacionadas ao versículo.
4. Conecte o versículo com o contexto histórico ou com o sacrifício de Jesus, se aplicável.
5. Mantenha seu tom severo, direto, poético e teologicamente preciso (não seja motivacional barata).
6. Concentre-se no versículo principal, mas pode referenciar o capítulo para dar contexto.
7. Escreva de forma curta e impactante.`;

            const groqMessages = [
                { role: 'system' as const, content: systemPrompt },
                ...history.map(m => ({
                    role: m.role === 'user' ? 'user' as const : 'assistant' as const,
                    content: m.content
                }))
            ];

            const response = await callGroqChat(groqMessages);

            const assistantMessage: ChatMessage = {
                id: Math.random().toString(36).substring(7),
                role: 'assistant',
                content: response,
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, assistantMessage]);
            await chatStorage.saveMessage(threadId, assistantMessage);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = {
                id: 'err',
                role: 'assistant',
                content: 'Desculpe, a conexão com o conhecimento falhou. Pode repetir?',
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
                    />
                    
                    <motion.div
                        initial={{ x: '100%', opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-full md:w-[450px] bg-[#0d0d0d] border-l border-white/10 z-[100] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                                     {aiAvatar ? (
                                        <img src={aiAvatar} alt="Olyviah" className="w-full h-full object-cover" />
                                     ) : (
                                        <img src={logo} className="w-5 h-5 object-contain grayscale opacity-60" alt="Olyviah" />
                                     )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white">Olyviah Exegesis</h3>
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Estudo Aprofundado</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Reference Context */}
                        <div className="p-4 bg-white/[0.02] border-b border-white/[0.05] shrink-0">
                            <div className="flex items-start gap-3">
                                <BookOpen className="w-4 h-4 text-white/40 mt-1 shrink-0" />
                                <div>
                                    <span className="text-xs font-black text-white/60 uppercase tracking-widest block mb-1">
                                        {book} {chapter}:{verseNumber}
                                    </span>
                                    <p className="text-sm font-serif text-white/80 italic border-l-2 border-white/20 pl-3 leading-relaxed">
                                        "{verseText}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-[#0a0a0a]">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex gap-3",
                                        message.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {message.role !== 'user' && (
                                        <div className="w-6 h-6 rounded-full border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 mt-1">
                                             <Sparkles className="w-3 h-3 text-white/40" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                        message.role === 'user'
                                            ? "bg-[#2f2f2f] text-white shadow-md"
                                            : "bg-transparent text-gray-200"
                                    )}>
                                        {message.role === 'user' ? (
                                            <span className="whitespace-pre-wrap">{message.content}</span>
                                        ) : (
                                            <AnimatedMessage
                                                content={message.content}
                                                animate={message.id === messages[messages.length - 1]?.id && !isTyping && message.role === 'assistant'}
                                                speed={15}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Sparkles className="w-3 h-3 text-white/40" />
                                    </div>
                                    <div className="flex gap-1 items-center py-3">
                                        <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#0a0a0a] border-t border-white/10 shrink-0">
                            <form
                                onSubmit={handleSendMessage}
                                className="relative flex items-end gap-2 bg-[#1f1f1f] border border-white/10 rounded-2xl p-2 focus-within:border-white/30 transition-colors"
                            >
                                <textarea
                                    className="flex-1 bg-transparent border-none py-2 px-3 focus:ring-0 focus:outline-none text-sm max-h-32 overflow-y-auto resize-none scrollbar-hide"
                                    placeholder="Reflita com Olyviah..."
                                    rows={1}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'inherit';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    disabled={isTyping}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="p-2 bg-white text-black rounded-xl hover:opacity-90 disabled:opacity-30 transition-all mb-0.5"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
