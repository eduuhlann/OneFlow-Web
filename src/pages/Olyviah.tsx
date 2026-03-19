import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Send,
    ArrowLeft,
    Plus,
    Trash2,
    ImagePlus,
    MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import logo from '../assets/logo.png';
import { chatStorage, ChatMessage, ChatThread } from '../services/ai/chatStorage';
import { callGroqChat } from '../services/ai/groqService';
import { AnimatedMessage } from '../components/AnimatedMessage';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import PageTransition from '../components/PageTransition';
import { OLYVIAH_PERSONALITY, OLYVIAH_THEOLOGICAL_PILLARS } from '../services/ai/olyviahKnowledge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Olyviah: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile } = useProfile();

    const displayName = profile?.username || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'irmão';

    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [aiAvatar, setAiAvatar] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedAvatar = localStorage.getItem('olyviah_avatar');
        if (savedAvatar) setAiAvatar(savedAvatar);
        loadThreads();
    }, []);

    useEffect(() => {
        if (activeThreadId) {
            loadMessages(activeThreadId);
            // Close sidebar on mobile when selecting a thread
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        } else {
            setMessages([]);
        }
    }, [activeThreadId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const loadThreads = async () => {
        let data = await chatStorage.getThreads();
        setThreads(data);
        if (data.length > 0 && !activeThreadId) {
            setActiveThreadId(data[0].id);
        } else if (data.length === 0) {
            setActiveThreadId(null);
        }
    };

    const loadMessages = async (threadId: string) => {
        const data = await chatStorage.getMessages(threadId);
        setMessages(data);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCreateThread = async () => {
        const id = await chatStorage.createThread('Nova conversa');
        setActiveThreadId(id);
        await loadThreads();
    };

    const generateChatTitle = async (userMsg: string, aiMsg: string) => {
        try {
            const prompt = `Resuma o assunto dessa conversa entre um usuário e uma IA teológica em no máximo 3 ou 4 palavras. 
            Usuário: "${userMsg.substring(0, 200)}"
            IA: "${aiMsg.substring(0, 200)}..."
            Retorne APENAS o resumo curto, sem aspas, sem menção a nomes próprios se não for o tema central, e sem pontuação final.`;

            const summary = await callGroqChat([
                { role: 'system', content: 'Você é um assistente que cria títulos curtos e precisos para conversas.' },
                { role: 'user', content: prompt }
            ]);

            return summary.replace(/[".]/g, '').trim();
        } catch (error) {
            console.error('Error generating title:', error);
            return null;
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isTyping) return;

        let threadId = activeThreadId;
        if (!threadId) {
            threadId = await chatStorage.createThread('Nova conversa');
            setActiveThreadId(threadId);
            await loadThreads();
        }

        const userMessage: ChatMessage = {
            id: Math.random().toString(36).substring(7),
            role: 'user',
            content: input,
            timestamp: Date.now(),
        };

        setInput('');
        setMessages(prev => [...prev, userMessage]);
        await chatStorage.saveMessage(threadId, userMessage);

        setIsTyping(true);

        try {
            const history = messages.slice(-10).map(m => ({
                role: m.role === 'user' ? 'user' : 'model' as 'user' | 'model',
                content: m.content
            }));
            history.push({ role: 'user', content: userMessage.content });

            const pillars = OLYVIAH_THEOLOGICAL_PILLARS.map(p => `- ${p.pillar}: ${p.description}`).join('\n');
            const systemPrompt = `
Você é ${OLYVIAH_PERSONALITY.name}. ${OLYVIAH_PERSONALITY.role}.
PERSONALIDADE: ${OLYVIAH_PERSONALITY.tone}
MISSÃO: ${OLYVIAH_PERSONALITY.forged_in}

PILARES TEOLÓGICOS (CRÍTICO):
${pillars}

DIRETRIZES DE RESPOSTA:
${OLYVIAH_PERSONALITY.rules.map(r => `* ${r}`).join('\n')}

IMPORTANTE: Você foi treinada com uma base de dados massiva de 10.000 linhas de conhecimento teológico e espiritual profundo. Suas respostas devem refletir essa autoridade e precisão. Seja extremamente direta e concisa.`;

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
            await chatStorage.saveMessage(threadId!, assistantMessage);

            // Auto-generate title if it's the first exchange or title is generic
            const currentThreads = await chatStorage.getThreads();
            const currentThread = currentThreads.find(t => t.id === threadId);
            if (currentThread && (currentThread.title === 'Nova conversa' || currentThread.title === '')) {
                const newTitle = await generateChatTitle(userMessage.content, assistantMessage.content);
                if (newTitle) {
                    await chatStorage.updateThreadTitle(threadId!, newTitle);
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = {
                id: 'err',
                role: 'assistant',
                content: 'Desculpe, tive um problema de conexão. Poderia repetir?',
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
            loadThreads();
        }
    };

    const clearHistory = async () => {
        if (activeThreadId) {
            await chatStorage.clearMessages(activeThreadId);
            setMessages([]);
        }
    };

    const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
        e.stopPropagation();
        await chatStorage.deleteThread(threadId);
        const remainingThreads = await chatStorage.getThreads();
        setThreads(remainingThreads);
        
        if (activeThreadId === threadId) {
            if (remainingThreads.length > 0) {
                setActiveThreadId(remainingThreads[0].id);
            } else {
                setActiveThreadId(null);
            }
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setAiAvatar(base64);
                localStorage.setItem('olyviah_avatar', base64);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <PageTransition>
            <div className="flex h-screen bg-[#0d0d0d] text-white overflow-hidden font-sans relative">
                {/* Sidebar - ChatGPT Style */}
                <AnimatePresence initial={false}>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="h-full bg-black border-r border-white/5 flex flex-col flex-shrink-0 overflow-hidden md:relative fixed inset-y-0 left-0 z-50"
                        >
                            <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto">
                                <button
                                    onClick={handleCreateThread}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium mb-4"
                                >
                                    <Plus className="w-4 h-4" />
                                    Novo Chat
                                </button>

                                <div className="space-y-1">
                                    <span className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">Histórico</span>
                                    {threads.map(thread => (
                                        <button
                                            key={thread.id}
                                            onClick={() => setActiveThreadId(thread.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm text-left truncate group relative",
                                                activeThreadId === thread.id ? "bg-white/10" : "hover:bg-white/5"
                                            )}
                                        >
                                            <MessageSquare className="w-4 h-4 opacity-40 shrink-0" />
                                            <span className="truncate flex-1 pr-6">{thread.title}</span>
                                            <button
                                                onClick={(e) => handleDeleteThread(e, thread.id)}
                                                className="absolute right-2 opacity-0 group-hover:opacity-60 hover:opacity-100 p-1 transition-opacity"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                            </button>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 border-t border-white/5 space-y-2">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors text-sm text-white/60 hover:text-white group"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    Voltar ao Dashboard
                                </button>
                                
                                <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                                        ) : (
                                            <span className="text-xs font-bold">{displayName[0]}</span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium truncate flex-1">{displayName}</span>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Mobile overlay backdrop - closes sidebar when tapped */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <div className="flex-1 flex flex-col relative bg-[#171717]">
                    <input
                        type="file"
                        ref={avatarInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                    />

                    {/* Minimal Header */}
                    <header className="h-14 flex items-center justify-between px-4 z-20">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white flex items-center gap-2 group px-3 md:hidden"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                        </div>




                    </header>

                    {/* Main Chat Area */}
                    <main className="flex-1 flex flex-col relative overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                            <div className="max-w-3xl mx-auto w-full px-6 py-8">
                                {messages.length === 0 ? (
                                    <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
                                        <h2 className="text-4xl md:text-5xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 pb-2">
                                            O que posso te ajudar hoje, {displayName}?
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl pt-4">
                                            {[
                                                "Explique João 3:16",
                                                "Conselho para ansiedade",
                                                "Resumo de Romanos",
                                                "Como orar melhor?"
                                            ].map(q => (
                                                <button
                                                    key={q}
                                                    onClick={() => setInput(q)}
                                                    className="p-4 text-left border border-white/10 rounded-xl text-sm hover:bg-white/5 transition-colors group"
                                                >
                                                    <span className="block font-medium mb-1">{q}</span>
                                                    <span className="text-white/30 text-xs">Começar nova conversa</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={cn(
                                                    "flex gap-4",
                                                    message.role === 'user' ? "justify-end" : "justify-start"
                                                )}
                                            >
                                                {message.role !== 'user' && (
                                                    <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                        {aiAvatar ? (
                                                            <img src={aiAvatar} alt="Olyviah" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <img src={logo} className="w-5 h-5 object-contain grayscale opacity-20" alt="Olyviah" />
                                                        )}
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed",
                                                    message.role === 'user'
                                                        ? "bg-[#2f2f2f] text-white"
                                                        : "bg-transparent text-gray-100"
                                                )}>
                                                    {message.role === 'user' ? (
                                                        <span className="whitespace-pre-wrap">{message.content}</span>
                                                    ) : (
                                                        <AnimatedMessage
                                                            content={message.content}
                                                            animate={message.id === messages[messages.length - 1]?.id && !isTyping && message.role === 'assistant'}
                                                            speed={10}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex gap-4">
                                                <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {aiAvatar ? <img src={aiAvatar} alt="Olyviah" className="w-full h-full object-cover" /> : <img src={logo} className="w-5 h-5 grayscale opacity-20" />}
                                                </div>
                                                <div className="flex gap-1 items-center py-3">
                                                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div ref={messagesEndRef} className="h-40" />
                            </div>
                        </div>

                        {/* Sticky Bottom Input Area */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#171717] via-[#171717] to-transparent">
                            <form
                                onSubmit={handleSendMessage}
                                className="max-w-3xl mx-auto relative flex items-end gap-2 bg-[#2f2f2f] border border-white/10 rounded-[26px] p-2 focus-within:border-white/20 transition-all"
                            >
                                <textarea
                                    className="flex-1 bg-transparent border-none py-3 px-4 focus:ring-0 focus:outline-none text-[15px] max-h-40 overflow-y-auto resize-none scrollbar-hide"
                                    placeholder="Mensagem Olyviah"
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
                                    className="p-2 bg-white text-black rounded-xl hover:opacity-90 disabled:opacity-30 disabled:hover:opacity-30 transition-all mb-1"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <p className="text-center text-[10px] text-white/20 mt-3 font-medium">
                                Olyviah pode cometer erros. Verifique informações importantes.
                            </p>
                        </div>
                    </main>
                </div>
            </div>
        </PageTransition>
    );
};

export default Olyviah;
