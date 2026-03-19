import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ArrowLeft, 
    User, 
    Users, 
    Plus, 
    Copy, 
    Check, 
    Send, 
    BookOpen, 
    Clock, 
    CheckCircle2, 
    MessageSquare,
    ChevronRight,
    TrendingUp,
    Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { discipleshipService, DiscipleshipTask, DiscipleshipNote } from '../services/features/discipleshipService';
import { statsService, BibleStats } from '../services/features/statsService';
import PageTransition from '../components/PageTransition';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Discipleship: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile } = useProfile();
    const [activeTab, setActiveTab] = useState<'me' | 'leadership'>('me');
    const [loading, setLoading] = useState(true);
    
    // Leadership data
    const [disciples, setDisciples] = useState<any[]>([]);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [selectedDisciple, setSelectedDisciple] = useState<any | null>(null);
    const [discipleStats, setDiscipleStats] = useState<BibleStats | null>(null);
    
    // Disciple data
    const [leader, setLeader] = useState<any | null>(null);
    const [joinCode, setJoinCode] = useState('');
    const [tasks, setTasks] = useState<DiscipleshipTask[]>([]);
    const [notes, setNotes] = useState<DiscipleshipNote[]>([]);
    const [noteInput, setNoteInput] = useState('');

    useEffect(() => {
        loadData();
    }, [user, activeTab]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (activeTab === 'leadership') {
                const [dList, code] = await Promise.all([
                    discipleshipService.getDisciples(user.id),
                    discipleshipService.getInviteCode(user.id)
                ]);
                setDisciples(dList);
                setInviteCode(code);
            } else {
                const [lData, taskList] = await Promise.all([
                    discipleshipService.getLeader(user.id),
                    discipleshipService.getTasks(user.id, false)
                ]);
                setLeader(lData);
                setTasks(taskList);
                
                if (lData) {
                    const noteList = await discipleshipService.getNotes(lData.leader_id, user.id);
                    setNotes(noteList);
                }
            }
        } catch (error) {
            console.error('Error loading discipleship data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        if (!user) return;
        try {
            const code = await discipleshipService.createInviteCode(user.id);
            setInviteCode(code);
        } catch (error) {
            alert('Erro ao gerar código.');
        }
    };

    const handleCopyCode = () => {
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleJoin = async () => {
        if (!user || !joinCode) return;
        try {
            await discipleshipService.joinDiscipleship(user.id, joinCode);
            setJoinCode('');
            loadData();
        } catch (error: any) {
            alert(error.message || 'Código inválido ou erro ao entrar.');
        }
    };

    const handleDiscipleClick = async (disciple: any) => {
        setSelectedDisciple(disciple);
        const stats = await statsService.getUserStats(disciple.disciple_id);
        const dTasks = await discipleshipService.getTasks(disciple.disciple_id, false);
        const dNotes = await discipleshipService.getNotes(user!.id, disciple.disciple_id);
        setDiscipleStats(stats);
        setTasks(dTasks);
        setNotes(dNotes);
    };

    const handleAddTask = async (title: string, type: string) => {
        if (!user || !selectedDisciple) return;
        try {
            await discipleshipService.assignTask(user.id, selectedDisciple.disciple_id, title, type);
            const dTasks = await discipleshipService.getTasks(selectedDisciple.disciple_id, false);
            setTasks(dTasks);
        } catch (error) {
            alert('Erro ao atribuir tarefa.');
        }
    };

    const handleCompleteTask = async (taskId: string) => {
        try {
            await discipleshipService.completeTask(taskId);
            const taskList = await discipleshipService.getTasks(user!.id, false);
            setTasks(taskList);
        } catch (error) {
            alert('Erro ao completar tarefa.');
        }
    };

    const handleAddNote = async () => {
        if (!user || !noteInput.trim()) return;
        const leaderId = activeTab === 'leadership' ? user.id : leader.leader_id;
        const discipleId = activeTab === 'leadership' ? selectedDisciple.disciple_id : user.id;
        
        try {
            await discipleshipService.addNote(leaderId, discipleId, user.id, noteInput);
            setNoteInput('');
            const noteList = await discipleshipService.getNotes(leaderId, discipleId);
            setNotes(noteList);
        } catch (error) {
            alert('Erro ao enviar nota.');
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#0d0d0d] text-white p-4 md:p-8 font-sans selection:bg-white selection:text-black">
                <div className="max-w-6xl mx-auto pb-24">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => selectedDisciple ? setSelectedDisciple(null) : navigate('/dashboard')} 
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase">
                                    {selectedDisciple ? 'Acompanhamento' : 'Discipulado OneFlow'}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-black italic -rotate-1 tracking-tighter">
                                    {selectedDisciple ? selectedDisciple.profiles.username : (activeTab === 'me' ? 'Meu Caminho' : 'Liderança')}
                                </h1>
                            </div>
                        </div>

                        {!selectedDisciple && (
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
                                <button
                                    onClick={() => setActiveTab('me')}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                        activeTab === 'me' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                                    )}
                                >
                                    Meu Caminho
                                </button>
                                <button
                                    onClick={() => setActiveTab('leadership')}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                        activeTab === 'leadership' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                                    )}
                                >
                                    Liderança
                                </button>
                            </div>
                        )}
                    </header>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Leadership Tab */}
                            {activeTab === 'leadership' && !selectedDisciple && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Users className="w-5 h-5 text-blue-500" />
                                            Seus Discípulos ({disciples.length})
                                        </h2>
                                        
                                        {disciples.length === 0 ? (
                                            <div className="p-12 border-2 border-dashed border-white/10 rounded-3xl text-center space-y-4">
                                                <p className="text-white/40">Você ainda não tem discípulos conectados.</p>
                                                <div className="max-w-xs mx-auto p-4 bg-white/5 rounded-2xl">
                                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Seu código de convite</p>
                                                    {inviteCode ? (
                                                        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white/10 rounded-xl border border-white/10">
                                                            <span className="text-lg font-black tracking-widest">{inviteCode}</span>
                                                            <button onClick={handleCopyCode} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={handleGenerateCode} className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm">
                                                            Gerar Código
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {disciples.map(d => (
                                                    <button 
                                                        key={d.id}
                                                        onClick={() => handleDiscipleClick(d)}
                                                        className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group text-left"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                                                            {d.profiles.avatar_url ? (
                                                                <img src={d.profiles.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                                                            ) : (
                                                                <User className="w-6 h-6 text-white/20" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-bold">{d.profiles.username}</h3>
                                                            <p className="text-[10px] text-white/40 font-medium">Desde {new Date(d.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                                            <h3 className="font-bold flex items-center gap-2">
                                                <Plus className="w-4 h-4 text-blue-500" />
                                                Convite
                                            </h3>
                                            <p className="text-[11px] text-white/40 leading-relaxed italic">
                                                Compartilhe seu código com quem você deseja discipular. Eles poderão entrar via aba "Meu Caminho".
                                            </p>
                                            {inviteCode && (
                                                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-black/40 rounded-xl border border-white/10">
                                                    <span className="text-lg font-black tracking-widest">{inviteCode}</span>
                                                    <button onClick={handleCopyCode} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Leadership -> Disciple Detail View */}
                            {activeTab === 'leadership' && selectedDisciple && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Stats & Progress */}
                                    <div className="space-y-6">
                                        <div className="p-8 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-white/10 rounded-[32px] space-y-6 shadow-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                                                    {selectedDisciple.profiles.avatar_url ? (
                                                        <img src={selectedDisciple.profiles.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-8 h-8 text-white/20" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold tracking-tight">{selectedDisciple.profiles.username}</h3>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Em Discípulado</p>
                                                </div>
                                            </div>

                                            {discipleStats && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Lidos</p>
                                                        <p className="text-xl font-black italic">{discipleStats.totalChaptersRead}</p>
                                                        <p className="text-[9px] text-white/20 mt-1">Capítulos</p>
                                                    </div>
                                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Completo</p>
                                                        <p className="text-xl font-black italic">{Math.round(discipleStats.completionPercentage)}%</p>
                                                        <p className="text-[9px] text-white/20 mt-1">Bíblia toda</p>
                                                    </div>
                                                </div>
                                            )}

                                            <button 
                                                onClick={() => handleAddTask('Ler João 1-3', 'chapter')}
                                                className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                            >
                                                <Plus className="w-4 h-4" /> Atribuir Tarefa
                                            </button>
                                        </div>

                                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                                            <h3 className="font-bold flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-white/40" />
                                                Progresso Recente
                                            </h3>
                                            <div className="space-y-4">
                                                {/* Mock of recent progress - in real app would fetch recent logs */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span className="text-xs text-white/60">Gênesis 1 concluído</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tasks & Notes */}
                                    <div className="lg:col-span-2 space-y-8">
                                        <section className="space-y-4">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <Target className="w-5 h-5 text-blue-500" />
                                                Tarefas Atribuídas
                                            </h3>
                                            <div className="space-y-3">
                                                {tasks.length === 0 ? (
                                                    <p className="text-sm text-white/20 italic">Nenhuma tarefa ativa.</p>
                                                ) : (
                                                    tasks.map(t => (
                                                        <div key={t.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", t.is_completed ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-400")}>
                                                                    {t.is_completed ? <CheckCircle2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold">{t.title}</p>
                                                                    <p className="text-[10px] text-white/40">{t.type === 'chapter' ? 'Leitura Bíblica' : 'Plano de Estudo'}</p>
                                                                </div>
                                                            </div>
                                                            {t.is_completed && <span className="text-[9px] font-bold text-green-500/60 uppercase tracking-widest">Concluída</span>}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <MessageSquare className="w-5 h-5 text-blue-500" />
                                                Diário Compartilhado
                                            </h3>
                                            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-[32px] flex flex-col h-[400px]">
                                                <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar">
                                                    {notes.length === 0 ? (
                                                        <p className="text-center text-white/20 text-xs py-8 italic">Inicie uma conversa ou deixe orientações aqui.</p>
                                                    ) : (
                                                        notes.map(n => (
                                                            <div key={n.id} className={cn("flex flex-col gap-1 max-w-[80%]", n.author_id === user!.id ? "ml-auto items-end" : "items-start")}>
                                                                <p className={cn("px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed", n.author_id === user!.id ? "bg-white text-black font-medium" : "bg-white/10 text-white")}>
                                                                    {n.content}
                                                                </p>
                                                                <span className="text-[8px] text-white/20 uppercase tracking-widest">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                                <div className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/10 focus-within:border-white/20 transition-all">
                                                    <input 
                                                        type="text" 
                                                        value={noteInput}
                                                        onChange={(e) => setNoteInput(e.target.value)}
                                                        placeholder="Mande uma mensagem ou orientação..." 
                                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                                    />
                                                    <button onClick={handleAddNote} className="p-2.5 bg-white text-black rounded-xl hover:scale-105 active:scale-95 transition-all">
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            )}

                            {/* My Path Tab (Disciple View) */}
                            {activeTab === 'me' && (
                                <>
                                    {!leader ? (
                                        <div className="max-w-xl mx-auto mt-12 space-y-8 text-center animate-in fade-in zoom-in duration-500">
                                            <div className="w-24 h-24 bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                                                <Users className="w-10 h-10 text-white/20" />
                                            </div>
                                            <div className="space-y-4">
                                                <h2 className="text-3xl font-black tracking-tighter italic">Encontre um Líder</h2>
                                                <p className="text-white/40 leading-relaxed text-sm">
                                                    O discipulado é um convite para andar acompanhado. Insira o código enviado pelo seu discipulador para começar.
                                                </p>
                                            </div>
                                            <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] space-y-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="CÓDIGO DE CONVITE" 
                                                    value={joinCode}
                                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                                    className="w-full bg-black/40 border-white/10 rounded-2xl p-4 text-center font-black tracking-[0.5em] focus:border-white/30 transition-all"
                                                />
                                                <button 
                                                    onClick={handleJoin}
                                                    disabled={!joinCode}
                                                    className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30"
                                                >
                                                    Conectar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            {/* Leader Info */}
                                            <div className="space-y-6">
                                                <div className="p-8 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 rounded-[32px] space-y-6 shadow-2xl">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                                                            {leader.profiles.avatar_url ? (
                                                                <img src={leader.profiles.avatar_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-8 h-8 text-white/20" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold tracking-tight">{leader.profiles.username}</h3>
                                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Seu Discipulador</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-white/60 leading-relaxed italic">
                                                        "Onde não há conselho os projetos saem vãos, mas na multidão de conselheiros se confirmam." — Pv 15:22
                                                    </p>
                                                </div>

                                                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                                                    <h3 className="font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40">
                                                        Resumo de Tarefas
                                                    </h3>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">Pendentes</span>
                                                        <span className="text-xl font-black italic">{tasks.filter(t => !t.is_completed).length}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tasks & Journal (Disciple View) */}
                                            <div className="lg:col-span-2 space-y-8">
                                                <section className="space-y-4">
                                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                                        <Target className="w-5 h-5 text-indigo-500" />
                                                        Minhas Tarefas
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {tasks.length === 0 ? (
                                                            <p className="text-sm text-white/20 italic">Seu líder ainda não atribuiu tarefas.</p>
                                                        ) : (
                                                            tasks.map(t => (
                                                                <div key={t.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl group">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", t.is_completed ? "bg-green-500/10 text-green-500" : "bg-indigo-500/10 text-indigo-400")}>
                                                                            {t.is_completed ? <CheckCircle2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold">{t.title}</p>
                                                                            <p className="text-[10px] text-white/40">{t.type === 'chapter' ? 'Leitura Bíblica' : 'Plano de Estudo'}</p>
                                                                        </div>
                                                                    </div>
                                                                    {!t.is_completed && (
                                                                        <button 
                                                                            onClick={() => handleCompleteTask(t.id)}
                                                                            className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            Concluir
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </section>

                                                <section className="space-y-4">
                                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                                        <MessageSquare className="w-5 h-5 text-indigo-500" />
                                                        Diário Compartilhado
                                                    </h3>
                                                    <div className="p-6 bg-white/[0.03] border border-white/10 rounded-[32px] flex flex-col h-[400px]">
                                                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar">
                                                            {notes.map(n => (
                                                                <div key={n.id} className={cn("flex flex-col gap-1 max-w-[80%]", n.author_id === user!.id ? "ml-auto items-end" : "items-start")}>
                                                                    <p className={cn("px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed", n.author_id === user!.id ? "bg-white text-black font-medium" : "bg-white/10 text-white")}>
                                                                        {n.content}
                                                                    </p>
                                                                    <span className="text-[8px] text-white/20 uppercase tracking-widest">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/10 focus-within:border-white/20 transition-all">
                                                            <input 
                                                                type="text" 
                                                                value={noteInput}
                                                                onChange={(e) => setNoteInput(e.target.value)}
                                                                placeholder="Mande uma nota ou reflexão..." 
                                                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2"
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                                            />
                                                            <button onClick={handleAddNote} className="p-2.5 bg-white text-black rounded-xl hover:scale-105 active:scale-95 transition-all">
                                                                <Send className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </section>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default Discipleship;
