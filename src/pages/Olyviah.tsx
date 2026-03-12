import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Send,
    ArrowLeft,
    Sparkles,
    Plus,
    MessageSquare,
    MoreVertical,
    Trash2,
    ChevronRight,
    Bot,
    User as UserIcon,
    ImagePlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import logo from '../assets/logo.png';
import { chatStorage, ChatMessage, ChatThread } from '../services/ai/chatStorage';
import { callGroqChat } from '../services/ai/groqService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
    const [showSidebar, setShowSidebar] = useState(false);
    const [aiAvatar, setAiAvatar] = useState<string | null>(localStorage.getItem('olyviah_avatar'));

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadThreads();
    }, []);

    useEffect(() => {
        if (activeThreadId) {
            loadMessages(activeThreadId);
        }
    }, [activeThreadId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const loadThreads = async () => {
        let data = await chatStorage.getThreads();
        if (data.length === 0) {
            const id = await chatStorage.createThread('Nova conversa');
            data = await chatStorage.getThreads();
            setActiveThreadId(id);
        }
        setThreads(data);
        if (data.length > 0 && !activeThreadId) {
            setActiveThreadId(data[0].id);
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
        loadThreads();
        setShowSidebar(false);
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

            // Olyviah's Persona System Prompt - Direct and Concise
            const systemPrompt = "Você é Olyviah, uma assistente espiritual do OneFlow. Seja extremamente direta ao ponto, concisa e prática. Ajude o usuário a entender a Bíblia e crescer espiritualmente com respostas curtas e objetivas. Nunca use emojis. Mantenha precisão teológica sem floreios.";

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
            await chatStorage.saveMessage(activeThreadId, assistantMessage);
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
            loadThreads(); // Update thread list with last message
        }
    };

    const clearHistory = async () => {
        if (activeThreadId) {
            await chatStorage.clearMessages(activeThreadId);
            setMessages([]);
        }
    };

    const deleteThread = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await chatStorage.deleteThread(id);
        if (activeThreadId === id) {
            setActiveThreadId(null);
            setMessages([]);
        }
        loadThreads();
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
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
            <input
                type="file"
                ref={avatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
            />
            {/* Sidebar - Desktop */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-80 bg-[#0a0a0a] border-r border-white/5 transition-transform duration-300 transform lg:relative lg:translate-x-0",
                showSidebar ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white/90">Conversas</h2>
                        <button onClick={handleCreateThread} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                        {threads.map(thread => (
                            <button
                                key={thread.id}
                                onClick={() => {
                                    setActiveThreadId(thread.id);
                                    setShowSidebar(false);
                                }}
                                className={cn(
                                    "w-full flex flex-col gap-1 p-4 rounded-2xl transition-all border text-left group",
                                    activeThreadId === thread.id
                                        ? "bg-white/10 border-white/10"
                                        : "bg-transparent border-transparent hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "font-bold text-sm truncate flex-1",
                                        activeThreadId === thread.id ? "text-white" : "text-gray-400"
                                    )}>
                                        {thread.title}
                                    </span>
                                    <button
                                        onClick={(e) => deleteThread(thread.id, e)}
                                        className="p-1 px-3 hover:bg-white/10 rounded-lg text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-600 truncate uppercase font-black tracking-widest">{thread.lastMessage || 'Sem mensagens'}</p>
                            </button>
                        ))}
                    </div>

                    <button onClick={() => navigate('/dashboard')} className="mt-8 flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                        <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">Voltar ao Painel</span>
                    </button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col relative bg-black">
                {/* Chat Header */}
                <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-black/50 backdrop-blur-xl z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowSidebar(true)} className="lg:hidden p-2 hover:bg-white/5 rounded-xl">
                            <MessageSquare className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center overflow-hidden">
                                    {aiAvatar ? (
                                        <img src={aiAvatar} alt="Olyviah" className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={logo} alt="Olyviah" className="w-6 h-6 object-contain grayscale opacity-60" />
                                    )}
                                </div>
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ImagePlus className="w-4 h-4" />
                                </button>
                            </div>
                            <div>
                                <h1 className="font-bold text-lg">Olyviah</h1>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">IA Missionária Online</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={clearHistory} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors group">
                            <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-400" />
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6">
                            <div className="w-20 h-20 rounded-[32px] bg-white/[0.03] border border-white/5 flex items-center justify-center p-5 relative group overflow-hidden">
                                {aiAvatar ? (
                                    <img src={aiAvatar} alt="Olyviah" className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                    <img src={logo} alt="OneFlow" className="w-full h-full object-contain grayscale opacity-20" />
                                )}
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ImagePlus className="w-6 h-6" />
                                </button>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2 text-white">Paz do Senhor, {displayName}</h2>
                                <p className="text-white/40 leading-relaxed italic text-sm">
                                    Sou Olyviah. Estou aqui para caminhar com você em sua jornada espiritual. O que gostaria de compartilhar hoje?
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 w-full">
                                {[
                                    "Como entender Romanos 8?",
                                    "Me dê uma palavra de conforto.",
                                    "Quais os planos de Deus na minha vida?"
                                ].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => setInput(q)}
                                        className="p-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-medium hover:bg-white/10 hover:border-white/10 transition-all text-left"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-4 max-w-3xl mx-auto",
                                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden",
                                        message.role === 'user' ? "bg-white/10" : "bg-white/5 border border-white/10 p-0"
                                    )}>
                                        {message.role === 'user' ? <UserIcon className="w-4 h-4" /> : (
                                            aiAvatar ? (
                                                <img src={aiAvatar} alt="Olyviah" className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={logo} className="w-5 h-5 object-contain grayscale opacity-60" alt="Olyviah" />
                                            )
                                        )}
                                    </div>
                                    <div className={cn(
                                        "flex flex-col gap-2",
                                        message.role === 'user' ? "items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "p-4 rounded-3xl text-base leading-relaxed whitespace-pre-wrap",
                                            message.role === 'user'
                                                ? "bg-white text-black font-medium"
                                                : "bg-white/[0.03] border border-white/[0.06] text-gray-200"
                                        )}>
                                            {message.content}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">
                                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-4 max-w-3xl mx-auto">
                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1 p-0 overflow-hidden">
                                        {aiAvatar ? (
                                            <img src={aiAvatar} alt="Olyviah" className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={logo} className="w-5 h-5 object-contain grayscale opacity-60" alt="Olyviah" />
                                        )}
                                    </div>
                                    <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-3xl flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-gradient-to-t from-black via-black to-transparent">
                    <form
                        onSubmit={handleSendMessage}
                        className="max-w-3xl mx-auto relative group"
                    >
                        <input
                            type="text"
                            placeholder="Fale com Olyviah..."
                            className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-6 pr-16 focus:outline-none focus:border-white/30 transition-all font-medium text-lg placeholder:text-gray-700"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isTyping || !activeThreadId}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping || !activeThreadId}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white text-black rounded-2xl hover:bg-gray-200 disabled:bg-white/5 disabled:text-gray-700 transition-all active:scale-90"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] font-bold text-gray-700 uppercase tracking-widest mt-4">
                        Olyviah pode cometer erros. Sempre verifique as escritas sagradas.
                    </p>
                </div>
            </main>

            {/* Overlay for mobile sidebar */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSidebar(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Olyviah;
