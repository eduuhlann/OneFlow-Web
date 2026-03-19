import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft,
    User,
    Users,
    Plus,
    Search,
    Send,
    BookOpen,
    Clock,
    CheckCircle2,
    MessageSquare,
    ChevronRight,
    TrendingUp,
    Target,
    X,
    MoreVertical,
    Check,
    UserPlus,
    CheckCircle,
    XCircle,
    Paperclip,
    FileText,
    Image as ImageIcon,
    Download,
    Trash2,
    Loader2,
    LogOut,
    MessageSquarePlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { discipleshipService, DiscipleshipTask, DiscipleshipNote } from '../services/features/discipleshipService';
import { statsService, BibleStats } from '../services/features/statsService';
import PageTransition from '../components/PageTransition';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../services/supabase';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Discipleship: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile } = useProfile();
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'chat'>('list');

    // UI States
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState<'global' | 'group'>('global');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    // Data States
    const [connections, setConnections] = useState<any[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<any | null>(null);
    const [notes, setNotes] = useState<DiscipleshipNote[]>([]);
    const [tasks, setTasks] = useState<DiscipleshipTask[]>([]);
    const [stats, setStats] = useState<BibleStats | null>(null);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [noteInput, setNoteInput] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadConnections();
    }, [user]);

    useEffect(() => {
        if (selectedConnection) {
            loadChatData();
            const channel = subscribeToMessages();
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedConnection]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [notes]);

    const loadConnections = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [disciples, leaderData, groups] = await Promise.all([
                discipleshipService.getDisciples(user.id),
                discipleshipService.getLeader(user.id),
                discipleshipService.getGroups(user.id)
            ]);

            // Normalize connections for the list
            const all = [
                ...(leaderData ? [{ ...leaderData, type: 'leader', profile: leaderData.profiles }] : []),
                ...disciples.map(d => ({ ...d, type: 'disciple', profile: d.profiles })),
                ...groups.map(g => ({ ...g, type: 'group' }))
            ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

            setConnections(all);
        } catch (error) {
            console.error('Error loading connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadChatData = async () => {
        if (!user || !selectedConnection) return;
        try {
            let noteList: DiscipleshipNote[] = [];
            let taskList: DiscipleshipTask[] = [];
            let bibleStats: BibleStats | null = null;
            let members: any[] = [];

            if (selectedConnection.type === 'group') {
                const groupId = selectedConnection.id;
                const leaderId = selectedConnection.leader_id;
                [noteList, members] = await Promise.all([
                    discipleshipService.getNotes(leaderId, null, groupId),
                    discipleshipService.getGroupMembers(groupId)
                ]);
                setGroupMembers(members);
            } else {
                const discipleId = selectedConnection.type === 'leader' ? user.id : selectedConnection.disciple_id;
                const leaderId = selectedConnection.type === 'leader' ? selectedConnection.leader_id : user.id;

                [noteList, taskList, bibleStats] = await Promise.all([
                    discipleshipService.getNotes(leaderId, discipleId),
                    discipleshipService.getTasks(discipleId, false),
                    statsService.getUserStats(discipleId)
                ]);
            }

            setNotes(noteList);
            setTasks(taskList);
            setStats(bibleStats);
        } catch (error) {
            console.error('Error loading chat data:', error);
        }
    };

    const subscribeToMessages = () => {
        const leaderId = selectedConnection.type === 'leader' ? selectedConnection.leader_id : (selectedConnection.leader_id || user!.id);
        const discipleId = selectedConnection.type === 'leader' ? user!.id : (selectedConnection.disciple_id || null);
        const groupId = selectedConnection.type === 'group' ? selectedConnection.id : null;

        const channel = supabase
            .channel(`discipleship-chat-${selectedConnection.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'discipleship_notes'
                },
                async (payload) => {
                    const newNote = payload.new as DiscipleshipNote;
                    console.log('New note received:', newNote);
                    if (groupId) {
                        if (newNote.group_id === groupId) {
                            if (!groupMembers.some(m => m.user_id === newNote.author_id)) {
                                const latestMembers = await discipleshipService.getGroupMembers(groupId);
                                setGroupMembers(latestMembers);
                            }
                            setNotes(prev => {
                                if (prev.some(note => note.id === newNote.id)) return prev;
                                return [...prev, newNote];
                            });
                        }
                    } else if (newNote.leader_id === leaderId && newNote.disciple_id === discipleId) {
                        setNotes(prev => {
                            if (prev.some(note => note.id === newNote.id)) return prev;
                            return [...prev, newNote];
                        });
                    }
                }
            );

        channel.subscribe((status) => {
            console.log('Subscription status:', status);
        });

        return channel;
    };

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length >= 3) {
            const results = await discipleshipService.searchUsers(q);
            setSearchResults(results.filter(r => r.id !== user?.id));
        } else {
            setSearchResults([]);
        }
    };

    const handleInvite = async (targetUser: any) => {
        if (!user) return;
        try {
            if (searchMode === 'group' && selectedConnection?.type === 'group') {
                await discipleshipService.inviteToGroup(selectedConnection.id, targetUser.id);
            } else {
                await discipleshipService.sendDirectInvite(user.id, targetUser.id);
            }
            setInviteSuccess(targetUser.username);
            setTimeout(() => {
                setInviteSuccess(null);
                setIsSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
                loadConnections();
            }, 2000);
        } catch (error) {
            alert('Erro ao enviar convite.');
        }
    };

    const handleCreateGroup = async () => {
        if (!user || !newGroupName.trim() || isCreatingGroup) return;
        setIsCreatingGroup(true);
        try {
            const groupId = await discipleshipService.createGroup(user.id, newGroupName);
            setNewGroupName('');
            setIsGroupModalOpen(false);
            loadConnections();

            // Automatically select the new group
            const newGroup = { id: groupId, name: newGroupName, leader_id: user.id, type: 'group' };
            handleSelectConnection(newGroup);
        } catch (error: any) {
            console.error('Error creating group:', error);
            alert(`Erro ao criar grupo: ${error.message || 'Verifique se você rodou o SQL das tabelas no Supabase.'}`);
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!selectedConnection || selectedConnection.type !== 'group' || !window.confirm('Tem certeza que deseja excluir este grupo?')) return;
        try {
            await discipleshipService.deleteGroup(selectedConnection.id);
            setSelectedConnection(null);
            setView('list');
            loadConnections();
        } catch (error) {
            alert('Erro ao excluir grupo.');
        }
    };

    const handleRemoveMember = async (targetUserId: string) => {
        if (!selectedConnection || !window.confirm('Tem certeza que deseja remover este membro?')) return;
        try {
            await discipleshipService.removeGroupMember(selectedConnection.id, targetUserId);
            const updated = await discipleshipService.getGroupMembers(selectedConnection.id);
            setGroupMembers(updated);
        } catch (error) {
            alert('Erro ao remover membro.');
        }
    };

    const handlePromoteMember = async (memberId: string) => {
        try {
            await discipleshipService.updateMemberRole(memberId, 'admin');
            const updated = await discipleshipService.getGroupMembers(selectedConnection!.id);
            setGroupMembers(updated);
        } catch (error) {
            alert('Erro ao promover membro.');
        }
    };

    const handleStartPrivateChat = async (targetUserId: string) => {
        if (!user || targetUserId === user.id) return;
        try {
            const conn = await discipleshipService.getOrCreateConnection(user.id, targetUserId);
            // Create a pseudo-connection object compatible with handleSelectConnection
            const formattedConn = {
                ...conn,
                type: conn.leader_id === user.id ? 'disciple' : 'leader',
                profile: conn.profiles
            };
            setIsMembersModalOpen(false);
            handleSelectConnection(formattedConn);
        } catch (error) {
            alert('Erro ao iniciar chat privado.');
        }
    };

    const handleRespondInvite = async (conn: any, accept: boolean) => {
        try {
            if (conn.member_id) {
                await discipleshipService.respondToGroupInvite(conn.member_id, accept);
            } else {
                await discipleshipService.respondToInvite(conn.id, accept);
            }
            loadConnections();
            if (accept) {
                handleSelectConnection({ ...conn, status: 'active', member_status: 'active' });
            }
        } catch (error) {
            alert('Erro ao responder convite.');
        }
    };

    const handleSendMessage = async (fileData: any = null) => {
        if (!user || (!noteInput.trim() && !fileData) || !selectedConnection) return;
        const leaderId = selectedConnection.type === 'leader' ? selectedConnection.leader_id : (selectedConnection.leader_id || user.id);
        const discipleId = selectedConnection.type === 'leader' ? user.id : (selectedConnection.disciple_id || null);
        const groupId = selectedConnection.type === 'group' ? selectedConnection.id : null;

        try {
            await discipleshipService.addNote(leaderId, discipleId, user.id, noteInput, groupId, fileData);
            setNoteInput('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleLeaveGroup = async () => {
        if (!user || !selectedConnection || selectedConnection.type !== 'group' || !window.confirm('Tem certeza que deseja sair deste grupo?')) return;
        try {
            await discipleshipService.leaveGroup(selectedConnection.id, user.id);
            setSelectedConnection(null);
            setView('list');
            loadConnections();
        } catch (error) {
            alert('Erro ao sair do grupo.');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isGroupAvatar: boolean = false) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const result = await discipleshipService.uploadFile(file);
            if (isGroupAvatar && selectedConnection?.type === 'group') {
                await discipleshipService.updateGroupAvatar(selectedConnection.id, result.url);
                setSelectedConnection(prev => ({ ...prev, avatar_url: result.url }));
                loadConnections();
            } else {
                await handleSendMessage(result);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erro ao subir arquivo.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleMemberAction = async (member: any) => {
        if (!user || member.user_id === user.id) return;

        try {
            const conn = await discipleshipService.getPrivateConnection(user.id, member.user_id);
            if (conn) {
                handleSelectConnection(conn);
            } else {
                // If no connection, maybe show invite modal for that user?
                setSearchQuery(member.profiles?.username || '');
                setIsSearchOpen(true);
                handleSearch(member.profiles?.username || '');
            }
        } catch (error) {
            console.error('Error opening private chat:', error);
        }
    };

    const handleSelectConnection = (conn: any) => {
        setSelectedConnection(conn);
        setIsMenuOpen(false);
        setView('chat');
        if (user) {
            const leaderId = conn.type === 'leader' ? conn.leader_id : (conn.leader_id || user.id);
            const discipleId = conn.type === 'leader' ? user.id : (conn.disciple_id || null);
            const groupId = conn.type === 'group' ? conn.id : null;
            discipleshipService.markNotesAsRead(leaderId, discipleId, user.id, groupId);
        }
    };

    return (
        <PageTransition>
            <div className="h-screen bg-[#0d0d0d] text-white flex flex-col font-sans overflow-hidden">
                {/* Modals handled same as before... (Search, Group Creation) */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-xl font-bold tracking-tight">
                                        {searchMode === 'group' ? `Convidar para ${selectedConnection?.name}` : 'Novo Discipulado'}
                                    </h3>
                                    <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input type="text" autoFocus placeholder="Buscar por usuário..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="w-full bg-black/40 border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-0 focus:border-white/30 transition-all font-medium" />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                        {inviteSuccess ? (
                                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 animate-bounce">
                                                    <Check className="w-8 h-8" />
                                                </div>
                                                <p className="text-sm font-bold text-white/60">Convite enviado para <span className="text-white">{inviteSuccess}</span>!</p>
                                            </div>
                                        ) : (
                                            searchResults.map(r => (
                                                <div key={r.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">{r.avatar_url && <img src={r.avatar_url} className="w-full h-full object-cover" />}</div>
                                                        <span className="font-bold text-sm">{r.username}</span>
                                                    </div>
                                                    <button onClick={() => handleInvite(r)} className="px-4 py-2 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Convidar</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isGroupModalOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-xl font-bold tracking-tight">Criar Novo Grupo</h3>
                                    <button onClick={() => setIsGroupModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Nome do Grupo</label>
                                        <input type="text" autoFocus placeholder="Ex: Discipulado Jovens" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full bg-black/40 border-white/10 rounded-2xl py-4 px-6 text-sm focus:ring-0 focus:border-white/30 transition-all font-medium" />
                                    </div>
                                    <button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isCreatingGroup} className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isCreatingGroup ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> CRIANDO...
                                            </>
                                        ) : 'Criar Grupo'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <aside className={cn("w-full md:w-[380px] border-r border-white/5 flex flex-col transition-all", view === 'chat' ? 'hidden md:flex' : 'flex')}>
                        <header className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><ArrowLeft className="w-5 h-5" /></button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setSearchMode('global'); setIsSearchOpen(true); }} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all shadow-xl" title="Novo Chat Privado"><MessageSquarePlus className="w-5 h-5 text-white/60" /></button>
                                    <button onClick={() => setIsGroupModalOpen(true)} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all shadow-xl" title="Novo Grupo"><Users className="w-5 h-5 text-white/60" /></button>
                                    <button onClick={() => { setSearchMode('global'); setIsSearchOpen(true); }} className="p-3 bg-white text-black rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-xl"><Plus className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar pb-24">
                            {connections.map(conn => {
                                const isPending = (conn.status === 'pending') || (conn.type === 'member' && conn.member_status === 'pending');
                                return (
                                    <button key={`${conn.type}-${conn.id}`} onClick={() => !isPending && handleSelectConnection(conn)} disabled={isPending} className={cn("w-full p-4 rounded-[28px] flex items-center gap-4 transition-all group", selectedConnection?.id === conn.id ? "bg-white/10 border border-white/10 shadow-lg" : "hover:bg-white/5 border border-transparent", isPending && "cursor-default opacity-80")}>
                                        <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                            {conn.type === 'group' ? (
                                                conn.avatar_url ? <img src={conn.avatar_url} className="w-full h-full object-cover" /> : <Users className="w-6 h-6 text-white/40" />
                                            ) : conn.profile?.avatar_url ? (
                                                <img src={conn.profile.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 text-white/20" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm">{conn.type === 'group' ? conn.name : (conn.profile?.username || 'Usuário')}</span>
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                    conn.type === 'leader' ? "bg-indigo-500/10 text-indigo-400" : "bg-white/5 text-white/20"
                                                )}>
                                                    {conn.type === 'leader' ? 'Líder' : 'Discípulo'}
                                                </span>
                                            </div>
                                            {isPending ? (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button onClick={(e) => { e.stopPropagation(); handleRespondInvite(conn, true); }} className="px-3 py-1 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Aceitar</button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleRespondInvite(conn, false); }} className="px-3 py-1 bg-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Recusar</button>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-white/40 line-clamp-1 italic">Toque para abrir a conversa...</p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Chat Area */}
                    <main className={cn("flex-1 flex flex-col bg-[#0d0d0d] transition-all relative", view === 'list' ? 'hidden md:flex' : 'flex')}>
                        {selectedConnection ? (
                            <>
                                <header className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setView('list')} className="md:hidden p-2.5 bg-white/5 rounded-xl"><ArrowLeft className="w-5 h-5" /></button>
                                        <div className="flex items-center gap-3">
                                            <div className="relative group/avatar">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
                                                    {selectedConnection.type === 'group' ? (
                                                        selectedConnection.avatar_url ? <img src={selectedConnection.avatar_url} className="w-full h-full object-cover" /> : <Users className="w-5 h-5 md:w-6 md:h-6 text-white/40" />
                                                    ) : selectedConnection.profile?.avatar_url ? (
                                                        <img src={selectedConnection.profile.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 md:w-6 md:h-6 text-white/20" />
                                                    )}
                                                </div>
                                                {selectedConnection.type === 'group' && selectedConnection.leader_id === user?.id && (
                                                    <button
                                                        onClick={() => {
                                                            const input = document.createElement('input');
                                                            input.type = 'file';
                                                            input.accept = 'image/*,image/gif';
                                                            input.onchange = (e: any) => handleFileUpload(e, true);
                                                            input.click();
                                                        }}
                                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center rounded-full"
                                                    >
                                                        <ImageIcon className="w-4 h-4 text-white" />
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm md:text-xl tracking-tight leading-tight">{selectedConnection.name || selectedConnection.profile?.username}</h3>
                                                <div className="flex items-center gap-2">
                                                    {selectedConnection.type === 'group' ? (
                                                        <div className="flex -space-x-1.5 overflow-hidden">
                                                            {groupMembers.slice(0, 3).map(m => (
                                                                <button key={m.id} onClick={() => handleMemberAction(m)} className="w-4 h-4 rounded-full border border-black bg-white/10 overflow-hidden hover:scale-110 transition-transform">
                                                                    {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="w-2.5 h-2.5 text-white/40 m-auto" />}
                                                                </button>
                                                            ))}
                                                            {groupMembers.length > 3 && <span className="text-[8px] font-bold text-white/30 ml-2">+{groupMembers.length - 3}</span>}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Disponível</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 relative">
                                        {selectedConnection.type === 'group' && selectedConnection.leader_id === user!.id && (
                                            <button onClick={() => { setSearchMode('group'); setIsSearchOpen(true); }} className="p-2.5 md:p-3 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-2xl transition-all border border-indigo-500/10">
                                                <UserPlus className="w-5 h-5 text-indigo-400" />
                                            </button>
                                        )}
                                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 md:p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        <AnimatePresence>
                                            {isMenuOpen && (
                                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30">
                                                    {selectedConnection.type === 'group' && (
                                                        <button onClick={() => { setIsMembersModalOpen(true); setIsMenuOpen(false); }} className="w-full p-4 flex items-center gap-3 text-white/60 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest border-b border-white/5">
                                                            <Users className="w-4 h-4" /> Ver Membros
                                                        </button>
                                                    )}
                                                    {selectedConnection.type === 'group' && (
                                                        selectedConnection.leader_id === user!.id ? (
                                                            <button onClick={handleDeleteGroup} className="w-full p-4 flex items-center gap-3 text-red-400 hover:bg-red-400/10 transition-colors text-xs font-bold uppercase tracking-widest">
                                                                <Trash2 className="w-4 h-4" /> Excluir Grupo
                                                            </button>
                                                        ) : (
                                                            <button onClick={handleLeaveGroup} className="w-full p-4 flex items-center gap-3 text-red-400 hover:bg-red-400/10 transition-colors text-xs font-bold uppercase tracking-widest">
                                                                <LogOut className="w-4 h-4" /> Sair do Grupo
                                                            </button>
                                                        )
                                                    )}

                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </header>

                                {/* Chat Feed */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                                    <div className="max-w-3xl mx-auto space-y-6">
                                        {notes.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                                <MessageSquare className="w-12 h-12 mb-4" />
                                                <p className="text-sm font-bold uppercase tracking-[0.2em]">Nenhuma mensagem ainda</p>
                                            </div>
                                        ) : (
                                            notes.map((n) => {
                                                const isMine = n.author_id === user!.id;
                                                const getProfile = (p: any) => Array.isArray(p) ? p[0] : p;

                                                let authorProfile = null;
                                                if (isMine) {
                                                    authorProfile = profile;
                                                } else if (selectedConnection.type === 'group') {
                                                    authorProfile = getProfile(groupMembers.find(m => m.user_id === n.author_id)?.profiles);
                                                } else {
                                                    authorProfile = getProfile(selectedConnection.profile);
                                                }

                                                return (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={n.id} className={cn("flex gap-3", isMine ? "flex-row-reverse ml-auto items-end" : "flex-row items-start")}>
                                                        {/* Avatar */}
                                                        <div className="shrink-0 mb-1">
                                                            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
                                                                {authorProfile?.avatar_url ? (
                                                                    <img src={authorProfile.avatar_url} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-4 h-4 text-white/20" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}>
                                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">
                                                                {authorProfile?.username || 'Usuário'}
                                                            </span>
                                                            <div className={cn("px-5 py-3.5 rounded-[28px] max-w-[280px] md:max-w-md group relative transition-all shadow-xl", isMine ? "bg-white text-black font-semibold rounded-tr-none" : "bg-white/5 border border-white/10 text-white rounded-tl-none")}>
                                                                {n.file_url ? (
                                                                    <div className="space-y-3">
                                                                        {n.file_type?.startsWith('image/') ? (
                                                                            <img src={n.file_url} className="rounded-2xl max-h-64 object-cover border border-black/10" />
                                                                        ) : (
                                                                            <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                                                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                                                                                <div className="flex-1 overflow-hidden">
                                                                                    <p className="text-[11px] font-bold truncate">{n.file_name}</p>
                                                                                    <p className="text-[9px] uppercase tracking-widest text-white/40">{n.file_type?.split('/')[1] || 'Arquivo'}</p>
                                                                                </div>
                                                                                <a href={n.file_url} target="_blank" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><Download className="w-4 h-4" /></a>
                                                                            </div>
                                                                        )}
                                                                        {n.content && <p className="text-sm mt-2">{n.content}</p>}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">{n.content}</p>
                                                                )}
                                                            </div>
                                                            <span className="text-[8px] text-white/20 font-bold uppercase px-1">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>

                                {/* Input Area */}
                                <footer className="p-6 bg-[#080808] border-t border-white/5">
                                    <div className="max-w-4xl mx-auto flex gap-3 items-end">
                                        <div className="relative">
                                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" />
                                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-4 bg-white/5 text-white/40 rounded-[24px] hover:bg-white/10 transition-all border border-white/5 disabled:opacity-50">
                                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Paperclip className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <div className="flex-1 bg-white/[0.03] rounded-[32px] flex flex-col p-2 transition-all group/input">
                                            <textarea rows={1} value={noteInput} onChange={(e) => setNoteInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Digite sua mensagem espiritual..." className="w-full bg-transparent border-none focus:ring-0 text-sm py-4 px-6 font-medium resize-none custom-scrollbar max-h-32 text-white/90" />
                                            <div className="flex justify-end p-2 opacity-60 hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleSendMessage()} disabled={!noteInput.trim() && !isUploading} className="p-3.5 bg-white text-black rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-lg disabled:opacity-50 disabled:scale-100">
                                                    <Send className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </footer>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-12 text-center bg-gradient-to-b from-transparent to-white/[0.02] mix-blend-screen opacity-40">
                                <div className="max-w-sm space-y-8">
                                    <MessageSquare className="w-20 h-20 text-white/10 mx-auto" />
                                    <h2 className="text-3xl font-black italic -rotate-1 tracking-tighter">Escolha uma jornada</h2>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
                <AnimatePresence>
                    {isMembersModalOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0f0f0f] border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-white/40" />
                                        <h2 className="text-xl font-black italic tracking-tight">Membros do Grupo</h2>
                                    </div>
                                    <button onClick={() => setIsMembersModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                                    {groupMembers.map(m => {
                                        const mProfile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                                        const isStaff = m.user_id === selectedConnection?.leader_id || m.role === 'admin';
                                        return (
                                            <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group/member">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center border border-white/10">
                                                        {mProfile?.avatar_url ? <img src={mProfile.avatar_url} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-white/20" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold">{mProfile?.username || 'Usuário'}</p>
                                                            {isStaff && <span className="text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full">{m.user_id === selectedConnection?.leader_id ? 'Líder' : 'ADM'}</span>}
                                                        </div>
                                                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-black leading-none mt-1">{m.status}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/member:opacity-100 transition-opacity">
                                                    {m.user_id !== user?.id && (
                                                        <button onClick={() => handleStartPrivateChat(m.user_id)} title="Conversar no privado" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><MessageSquare className="w-4 h-4" /></button>
                                                    )}
                                                    {selectedConnection?.leader_id === user?.id && m.user_id !== user?.id && (
                                                        <>
                                                            {m.role !== 'admin' && <button onClick={() => handlePromoteMember(m.id)} title="Promover a ADM" className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-all"><TrendingUp className="w-4 h-4 text-indigo-400" /></button>}
                                                            <button onClick={() => handleRemoveMember(m.user_id)} title="Expulsar do grupo" className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all"><Trash2 className="w-4 h-4 text-red-400" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

export default Discipleship;
