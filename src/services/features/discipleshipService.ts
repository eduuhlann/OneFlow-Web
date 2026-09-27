import { supabase } from '../supabase';
import { isMissingColumnError, isMissingFunctionError } from '../../lib/supabaseErrors';

export { isMissingColumnError };

export function normalizeProfile(profiles: any): any {
    if (!profiles) return null;
    return Array.isArray(profiles) ? profiles[0] ?? null : profiles;
}

export async function hashGroupPassword(password: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const data = new TextEncoder().encode(password);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }
    // Fallback para contextos sem WebCrypto (ex.: http sem TLS)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        hash = (hash << 5) - hash + password.charCodeAt(i);
        hash |= 0;
    }
    return `fnv${Math.abs(hash)}`;
}

export interface ConnectionRequest {
    id: string;
    from_id: string;
    created_at: string;
    from: {
        id: string;
        username: string | null;
        display_name?: string | null;
        avatar_url: string | null;
    } | null;
}

export interface DiscipleshipConnection {
    id: string;
    leader_id: string;
    disciple_id: string;
    status: 'active' | 'inactive';
    created_at: string;
    profiles?: {
        username: string | null;
        avatar_url: string | null;
    };
}

export interface DiscipleshipTask {
    id: string;
    leader_id: string;
    disciple_id: string;
    title: string;
    type: 'chapter' | 'plan' | 'reading' | 'other';
    target_id: string | null;
    is_completed: boolean;
    created_at: string;
}

export interface DiscipleshipNote {
    id: string;
    leader_id: string;
    disciple_id: string | null;
    author_id: string;
    content: string;
    created_at: string;
    group_id?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    is_read?: boolean;
}

export interface SocialUser {
    id: string;
    username: string | null;
    display_name?: string | null;
    avatar_url: string | null;
    banner_url?: string | null;
    bio?: string | null;
    is_following: boolean;
}

export interface SocialProfile {
    id: string;
    username: string | null;
    display_name?: string | null;
    avatar_url: string | null;
    banner_url?: string | null;
    bio?: string | null;
    short_bio?: string | null;
    featured_verse?: string | null;
    discord_decoration_url?: string | null;
    followers: number;
    following: number;
    chaptersRead: number;
    groups: number;
    connections: number;
    mutuals: number;
    isFollowing: boolean;
    isFollowedBy: boolean;
}

export const discipleshipService = {
    // Connection Management
    async createInviteCode(leaderId: string): Promise<string> {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error } = await supabase
            .from('discipleship_invites')
            .upsert({ leader_id: leaderId, code }, { onConflict: 'leader_id' });
        
        if (error) throw error;
        return code;
    },

    async getInviteCode(leaderId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('discipleship_invites')
            .select('code')
            .eq('leader_id', leaderId)
            .maybeSingle();
        
        if (error) return null;
        return data?.code || null;
    },

    async joinDiscipleship(discipleId: string, code: string): Promise<void> {
        // 1. Find the leader for this code
        const { data: invite, error: inviteError } = await supabase
            .from('discipleship_invites')
            .select('leader_id')
            .eq('code', code.toUpperCase())
            .single();
        
        if (inviteError || !invite) throw new Error('Código inválido.');

        // 2. Create connection
        const { error: connectError } = await supabase
            .from('discipleship_connections')
            .upsert(
                { leader_id: invite.leader_id, disciple_id: discipleId, status: 'active' },
                { onConflict: 'leader_id,disciple_id' }
            );
        
        if (connectError) throw connectError;
    },

    async getDisciples(leaderId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('discipleship_connections')
            .select(`
                *,
                profiles:disciple_id (
                    username,
                    avatar_url
                )
            `)
            .eq('leader_id', leaderId)
            .neq('status', 'inactive');
        
        if (error) {
            console.error('Error fetching disciples:', error);
            return [];
        }
        return data || [];
    },

    async getLeaders(discipleId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('discipleship_connections')
            .select(`
                *,
                profiles:leader_id (
                    username,
                    avatar_url
                )
            `)
            .eq('disciple_id', discipleId)
            .neq('status', 'inactive');
        
        if (error) return [];
        return data || [];
    },

    // Task Management
    async assignTask(leaderId: string, discipleId: string, title: string, type: string, targetId?: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_tasks')
            .insert({ leader_id: leaderId, disciple_id: discipleId, title, type, target_id: targetId });
        
        if (error) throw error;
    },

    async getTasks(userId: string | null, isLeader: boolean, groupId: string | null = null): Promise<DiscipleshipTask[]> {
        let query = supabase.from('discipleship_tasks').select('*');
        
        if (groupId) {
            // Filter by groupId inside the target_id JSON string
            query = query.filter('target_id', 'ilike', `%${groupId}%`);
        } else if (userId) {
            if (isLeader) {
                query = query.eq('leader_id', userId);
            } else {
                query = query.eq('disciple_id', userId);
            }
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return [];
        return data || [];
    },

    async createReadingChallenge(leaderId: string, discipleId: string, book: string, start: number, end: number, groupId?: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('discipleship_tasks')
                .insert({
                    leader_id: leaderId,
                    disciple_id: discipleId,
                    title: `Desafio: ${book} ${start}-${end}`,
                    type: 'reading',
                    target_id: JSON.stringify({ book, start, end, groupId }),
                    is_completed: false
                });
            
            if (error) {
                console.error('Error in createReadingChallenge:', error);
                throw error;
            }
        } catch (e) {
            console.error('Caught error in createReadingChallenge:', e);
            throw e;
        }
    },

    async completeTask(taskId: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_tasks')
            .update({ is_completed: true })
            .eq('id', taskId);
        
        if (error) throw error;
    },

    async checkAndSyncReadingTasks(userId: string): Promise<void> {
        // Fetch user's reading history directly from Supabase to avoid depending on local storage
        const { data: progress } = await supabase
            .from('reading_progress')
            .select('book_abbrev, chapter_number')
            .eq('user_id', userId);
        
        if (!progress) return;

        // Fetch user's active reading tasks
        const { data: activeTasks } = await supabase
            .from('discipleship_tasks')
            .select('*')
            .eq('disciple_id', userId)
            .eq('type', 'reading')
            .eq('is_completed', false);

        if (!activeTasks || activeTasks.length === 0) return;

        // Verify each active task
        for (const task of activeTasks) {
            try {
                const target = JSON.parse(task.target_id || '{}');
                if (!target.book || !target.start || !target.end) continue;

                // Check if all chapters in the range have been read
                let allRead = true;
                for (let chap = target.start; chap <= target.end; chap++) {
                    const hasRead = progress.some(p => p.book_abbrev === target.book && p.chapter_number === chap);
                    if (!hasRead) {
                        allRead = false;
                        break;
                    }
                }

                if (allRead) {
                    // Mark task as completed
                    await this.completeTask(task.id);
                }
            } catch (e) {
                console.error('Error syncing reading task:', e);
            }
        }
    },

    async getMemberActivity(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('reading_progress')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('Error fetching member activity:', error);
            return [];
        }
        return data || [];
    },

    // Notes Management
    async addNote(leaderId: string | null, discipleId: string | null, authorId: string, content: string, groupId: string | null = null, file: { url: string; name: string; type: string } | null = null): Promise<DiscipleshipNote> {
        const { data, error } = await supabase
            .from('discipleship_notes')
            .insert({ 
                leader_id: leaderId, 
                disciple_id: discipleId, 
                author_id: authorId, 
                content,
                group_id: groupId,
                file_url: file?.url,
                file_name: file?.name,
                file_type: file?.type
            })
            .select('*, profiles:author_id(*)')
            .single();
        
        if (error) throw error;
        return data as DiscipleshipNote;
    },

    async updateNote(noteId: string, content: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_notes')
            .update({ content })
            .eq('id', noteId);
        
        if (error) throw error;
    },

    async deleteNote(noteId: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_notes')
            .delete()
            .eq('id', noteId);
        
        if (error) throw error;
    },

    async getNotes(leaderId: string | null, discipleId: string | null, groupId: string | null = null): Promise<DiscipleshipNote[]> {
        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase.from('discipleship_notes').select('*, profiles:author_id(*)');
        let clearQuery = supabase.from('chat_clear_history').select('cleared_at').eq('user_id', user?.id || '').order('cleared_at', { ascending: false }).limit(1);
        
        if (groupId) {
            query = query.eq('group_id', groupId);
            clearQuery = clearQuery.eq('group_id', groupId);
        } else {
            // For private chats, filter by both participants and group_id is null
            query = query
                .eq('leader_id', leaderId)
                .eq('disciple_id', discipleId)
                .is('group_id', null);
                
            const partnerId = leaderId === user?.id ? discipleId : leaderId;
            clearQuery = clearQuery.eq('partner_id', partnerId).is('group_id', null);
        }

        const { data: clearData } = await clearQuery.maybeSingle();
        if (clearData?.cleared_at) {
            query = query.gt('created_at', clearData.cleared_at);
        }
        
        const { data, error } = await query.order('created_at', { ascending: true });
        
        if (error) {
            console.error('Error fetching notes:', error);
            return [];
        }
        return data || [];
    },

    async clearConversation(leaderId: string | null, discipleId: string | null, groupId: string | null = null): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let partnerId = null;
        if (!groupId) {
            partnerId = leaderId === user.id ? discipleId : leaderId;
        }

        // Remove old entries to keep the table clean
        let deleteQuery = supabase.from('chat_clear_history').delete().eq('user_id', user.id);
        if (groupId) deleteQuery = deleteQuery.eq('group_id', groupId);
        else deleteQuery = deleteQuery.eq('partner_id', partnerId).is('group_id', null);
        await deleteQuery;

        const { error } = await supabase.from('chat_clear_history').insert({
            user_id: user.id,
            group_id: groupId,
            partner_id: partnerId,
            cleared_at: new Date().toISOString()
        });

        if (error) throw error;
    },

    // User Search & Direct Invites
    async searchUsers(query: string): Promise<any[]> {
        if (!query || query.length < 3) return [];
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .ilike('username', `%${query}%`)
            .limit(10);
        
        if (error) return [];
        return data || [];
    },

    // Social: Seguir / Seguidores (estilo Instagram)
    async followUser(followerId: string, followingId: string): Promise<void> {
        if (followerId === followingId) return;
        const { error } = await supabase
            .from('discipleship_follows')
            .upsert(
                { follower_id: followerId, following_id: followingId },
                { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
            );
        if (error) throw error;
    },

    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);
        if (error) throw error;
    },

    async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
        const [followers, following] = await Promise.all([
            supabase.from('discipleship_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
            supabase.from('discipleship_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        ]);
        return {
            followers: followers.count || 0,
            following: following.count || 0,
        };
    },

    async getFollowState(viewerId: string, targetId: string): Promise<{ isFollowing: boolean; isFollowedBy: boolean }> {
        if (viewerId === targetId) return { isFollowing: false, isFollowedBy: false };
        const [mine, theirs] = await Promise.all([
            supabase.from('discipleship_follows').select('id').eq('follower_id', viewerId).eq('following_id', targetId).maybeSingle(),
            supabase.from('discipleship_follows').select('id').eq('follower_id', targetId).eq('following_id', viewerId).maybeSingle(),
        ]);
        return { isFollowing: !!mine.data, isFollowedBy: !!theirs.data };
    },

    async getMutualCount(viewerId: string, targetId: string): Promise<number> {
        const [mine, theirs] = await Promise.all([
            supabase.from('discipleship_follows').select('following_id').eq('follower_id', viewerId),
            supabase.from('discipleship_follows').select('follower_id').eq('follower_id', targetId),
        ]);
        const targetFollows = new Set((theirs.data || []).map(r => r.follower_id));
        return (mine.data || []).filter(r => targetFollows.has(r.following_id)).length;
    },

    async findProfileByUsername(username: string): Promise<{ id: string; username: string; display_name?: string | null } | null> {
        const clean = (username || '').replace(/^@/, '').trim();
        if (!clean) return null;
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, display_name')
            .eq('username', clean)
            .maybeSingle();
        if (error) throw error;
        return data as { id: string; username: string; display_name?: string | null } | null;
    },

    async getSocialProfile(targetId: string, viewerId: string): Promise<SocialProfile | null> {
        const [profileRes, counts, state, mutuals, connections, chapters, groups] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', targetId).maybeSingle(),
            this.getFollowCounts(targetId),
            this.getFollowState(viewerId, targetId),
            this.getMutualCount(viewerId, targetId),
            supabase.from('discipleship_connections').select('id', { count: 'exact', head: true })
                .or(`and(leader_id.eq.${viewerId},disciple_id.eq.${targetId}),and(leader_id.eq.${targetId},disciple_id.eq.${viewerId})`),
            supabase.from('reading_progress').select('*', { count: 'exact', head: true }).eq('user_id', targetId),
            supabase.from('discipleship_group_members').select('*', { count: 'exact', head: true }).eq('user_id', targetId).eq('status', 'active'),
        ]);

        if (!profileRes.data) return null;

        return {
            id: profileRes.data.id,
            username: profileRes.data.username,
            display_name: profileRes.data.display_name,
            avatar_url: profileRes.data.avatar_url,
            banner_url: profileRes.data.banner_url,
            bio: profileRes.data.bio,
            short_bio: profileRes.data.short_bio,
            featured_verse: profileRes.data.featured_verse,
            discord_decoration_url: profileRes.data.discord_decoration_url,
            followers: counts.followers,
            following: counts.following,
            chaptersRead: chapters.count || 0,
            groups: groups.count || 0,
            connections: connections.count || 0,
            mutuals,
            isFollowing: state.isFollowing,
            isFollowedBy: state.isFollowedBy,
        };
    },

    async searchUsersByUsername(query: string, viewerId: string): Promise<SocialUser[]> {
        const clean = query.replace(/^@+/, '').trim();
        if (clean.length < 2) return [];

        const { data: people, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${clean}%`)
            .neq('id', viewerId)
            .not('username', 'is', null)
            .limit(25);

        if (error || !people || people.length === 0) return [];

        const { data: myFollows } = await supabase
            .from('discipleship_follows')
            .select('following_id')
            .eq('follower_id', viewerId);

        const followingIds = new Set((myFollows || []).map(f => f.following_id));
        const lower = clean.toLowerCase();

        return people
            .map(p => ({ ...p, is_following: followingIds.has(p.id) }))
            .sort((a, b) => {
                const aStarts = (a.username || '').toLowerCase().startsWith(lower) ? 0 : 1;
                const bStarts = (b.username || '').toLowerCase().startsWith(lower) ? 0 : 1;
                if (aStarts !== bStarts) return aStarts - bStarts;
                return (a.username || '').localeCompare(b.username || '');
            });
    },

    async getSuggestedUsers(viewerId: string, limit = 6): Promise<SocialUser[]> {
        const [memberships, follows, connections] = await Promise.all([
            supabase.from('discipleship_group_members').select('group_id').eq('user_id', viewerId).eq('status', 'active'),
            supabase.from('discipleship_follows').select('following_id').eq('follower_id', viewerId),
            supabase.from('discipleship_connections').select('leader_id, disciple_id')
                .or(`leader_id.eq.${viewerId},disciple_id.eq.${viewerId}`),
        ]);

        const groupIds = (memberships.data || []).map(m => m.group_id);
        let groupMates: string[] = [];
        if (groupIds.length > 0) {
            const { data } = await supabase
                .from('discipleship_group_members')
                .select('user_id')
                .in('group_id', groupIds)
                .eq('status', 'active')
                .neq('user_id', viewerId);
            groupMates = [...new Set((data || []).map(m => m.user_id))];
        }

        const alreadyFollowing = new Set((follows.data || []).map(f => f.following_id));
        const connectedIds = new Set(
            (connections.data || []).flatMap(c => [c.leader_id, c.disciple_id]).filter(id => id !== viewerId)
        );

        const ordered = [...groupMates, ...connectedIds] as string[];
        const uniqueOrdered = [...new Set(ordered)].filter(id => !alreadyFollowing.has(id));

        const { data: recent } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', viewerId)
            .not('username', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(limit * 3);

        const candidates = [...uniqueOrdered, ...(recent || []).map(p => p.id)]
            .filter(id => !alreadyFollowing.has(id));
        const finalIds = [...new Set(candidates)].slice(0, limit);

        if (finalIds.length === 0) return [];

        const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', finalIds);

        return (profiles || []).map(p => ({ ...p, is_following: false }));
    },

    async sendDirectInvite(leaderId: string, discipleId: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_connections')
            .upsert(
                { leader_id: leaderId, disciple_id: discipleId, status: 'pending' },
                { onConflict: 'leader_id,disciple_id' }
            );
        if (error) throw error;
    },

    async respondToInvite(connectionId: string, accept: boolean): Promise<void> {
        const { error } = await supabase
            .from('discipleship_connections')
            .update({ status: accept ? 'active' : 'inactive' })
            .eq('id', connectionId);
        if (error) throw error;
    },

    // Solicitações de conexão (pedido antes de conectar de fato)
    async requestConnection(fromId: string, toId: string): Promise<void> {
        if (fromId === toId) return;

        const { data: existing } = await supabase
            .from('discipleship_connections')
            .select('id, leader_id, disciple_id, status')
            .or(`and(leader_id.eq.${fromId},disciple_id.eq.${toId}),and(leader_id.eq.${toId},disciple_id.eq.${fromId})`)
            .limit(1);

        const current = existing?.[0];
        if (current) {
            // Já existe pedido inverso esperando: conexão vira automática (mútuo)
            if (current.status === 'pending' && current.leader_id === toId) {
                const { error } = await supabase
                    .from('discipleship_connections')
                    .update({ status: 'active' })
                    .eq('id', current.id);
                if (error) throw error;
                return;
            }
            if (current.status === 'active') return;
            if (current.leader_id === fromId && current.status === 'pending') return;

            const { error } = await supabase
                .from('discipleship_connections')
                .update({ status: 'pending' })
                .eq('id', current.id);
            if (error) throw error;
            return;
        }

        const { error } = await supabase
            .from('discipleship_connections')
            .insert({ leader_id: fromId, disciple_id: toId, status: 'pending' });
        if (error) throw error;
    },

    async getConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
        const { data, error } = await supabase
            .from('discipleship_connections')
            .select('id, leader_id, disciple_id, status, created_at, from:profiles!discipleship_connections_leader_id_fkey(username, display_name, avatar_url)')
            .eq('disciple_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) return [];
        return (data || []).map((row: any) => ({
            id: row.id,
            from_id: row.leader_id,
            created_at: row.created_at,
            from: normalizeProfile(row.from),
        }));
    },

    async getSentConnectionRequests(userId: string): Promise<string[]> {
        const { data } = await supabase
            .from('discipleship_connections')
            .select('disciple_id')
            .eq('leader_id', userId)
            .eq('status', 'pending');
        return (data || []).map((r) => r.disciple_id);
    },

    async cancelConnectionRequest(fromId: string, toId: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_connections')
            .delete()
            .eq('leader_id', fromId)
            .eq('disciple_id', toId)
            .eq('status', 'pending');
        if (error) throw error;
    },

    async respondToConnectionRequest(requestId: string, accept: boolean): Promise<void> {
        const { error } = await supabase
            .from('discipleship_connections')
            .update({ status: accept ? 'active' : 'inactive' })
            .eq('id', requestId);
        if (error) throw error;
    },

    // Menções: quem pode ser citado numa conversa
    async getMentionCandidates(userId: string, groupId?: string | null): Promise<SocialUser[]> {
        const seen = new Map<string, SocialUser>();
        const push = (id: string | null | undefined, profile: any) => {
            if (!id || !profile || id === userId || seen.has(id)) return;
            seen.set(id, {
                id,
                username: profile.username ?? null,
                display_name: profile.display_name ?? null,
                avatar_url: profile.avatar_url ?? null,
                is_following: false,
            });
        };

        const [connections, groups] = await Promise.all([
            supabase
                .from('discipleship_connections')
                .select('leader_id, disciple_id, leader:profiles!discipleship_connections_leader_id_fkey(id, username, display_name, avatar_url), disciple:profiles!discipleship_connections_disciple_id_fkey(id, username, display_name, avatar_url)')
                .or(`leader_id.eq.${userId},disciple_id.eq.${userId}`)
                .eq('status', 'active')
                .limit(50),
            groupId
                ? supabase
                      .from('discipleship_group_members')
                      .select('user_id, profiles!discipleship_group_members_user_id_fkey(id, username, display_name, avatar_url)')
                      .eq('group_id', groupId)
                      .eq('status', 'active')
                      .limit(50)
                : Promise.resolve({ data: [] as any[] }),
        ]);

        for (const row of connections.data || []) {
            push(row.leader_id, normalizeProfile(row.leader));
            push(row.disciple_id, normalizeProfile(row.disciple));
        }
        for (const row of groups.data || []) {
            push(row.user_id, normalizeProfile(row.profiles?.[0] ?? row.profiles));
        }

        return Array.from(seen.values())
            .filter((u) => !!u.username)
            .sort((a, b) => (a.username || '').localeCompare(b.username || ''));
    },

    // Group Management
    async createGroup(leaderId: string, name: string, password?: string): Promise<{ id: string; passwordApplied: boolean }> {
        let joinPasswordHash: string | null = null;
        if (password && password.trim().length > 0) {
            joinPasswordHash = await hashGroupPassword(password.trim());
        }

        let data: any = null;
        let error: any = null;

        if (joinPasswordHash) {
            const result = await supabase
                .from('discipleship_groups')
                .insert({ leader_id: leaderId, name, join_password_hash: joinPasswordHash })
                .select()
                .single();
            data = result.data;
            error = result.error;

            // Coluna ainda não existe no banco: cria o grupo sem senha
            if (error && isMissingColumnError(error)) {
                const fallback = await supabase
                    .from('discipleship_groups')
                    .insert({ leader_id: leaderId, name })
                    .select()
                    .single();
                data = fallback.data;
                error = fallback.error;
                if (!error) {
                    await supabase
                        .from('discipleship_group_members')
                        .insert({ group_id: data.id, user_id: leaderId, status: 'active', role: 'admin' });
                    return { id: data.id, passwordApplied: false };
                }
            }
        } else {
            const result = await supabase
                .from('discipleship_groups')
                .insert({ leader_id: leaderId, name })
                .select()
                .single();
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        // Auto-add leader as an active member
        await supabase
            .from('discipleship_group_members')
            .insert({ group_id: data.id, user_id: leaderId, status: 'active', role: 'admin' });

        return { id: data.id, passwordApplied: !!joinPasswordHash && !error };
    },

    async verifyGroupPassword(groupId: string, password: string): Promise<boolean> {
        const normalized = password.trim();
        if (!normalized) return true;

        // Preferido: RPC no banco, para o hash não sair do servidor.
        const { data, error } = await supabase.rpc('verify_group_password', {
            p_group_id: groupId,
            p_password: normalized,
        });
        if (!error && typeof data === 'boolean') return data;

        // Migration ainda não aplicada: comparação local.
        if (isMissingFunctionError(error)) {
            const { data: group, error: gErr } = await supabase
                .from('discipleship_groups')
                .select('join_password_hash')
                .eq('id', groupId)
                .maybeSingle();
            if (gErr) {
                if (isMissingColumnError(gErr)) return true; // coluna ainda não existe
                throw gErr;
            }
            if (!group?.join_password_hash) return true; // grupo sem senha
            return (await hashGroupPassword(normalized)) === group.join_password_hash;
        }
        throw error;
    },

    async inviteToGroup(groupId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_group_members')
            .upsert({ group_id: groupId, user_id: userId, status: 'pending' }, { onConflict: 'group_id,user_id' });
        
        if (error) throw error;
    },

    async deleteGroup(groupId: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_groups')
            .delete()
            .eq('id', groupId);
        
        if (error) throw error;
    },

    async uploadFile(file: File): Promise<{ url: string; name: string; type: string }> {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `notes/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('discipleship_files')
            .upload(filePath, file, {
                contentType: file.type || 'application/octet-stream',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('discipleship_files')
            .getPublicUrl(filePath);

        return {
            url: data.publicUrl,
            name: file.name,
            type: file.type,
        };
    },

    async uploadGroupAvatar(groupId: string, file: File): Promise<string> {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const filePath = `avatars/group-${groupId}.${fileExt}`;

        // Map common extensions to correct MIME types
        const mimeMap: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            avif: 'image/avif',
        };
        const contentType = file.type || mimeMap[fileExt] || 'image/png';

        const { error: uploadError } = await supabase.storage
            .from('discipleship_files')
            .upload(filePath, file, {
                contentType,
                upsert: true, // overwrite previous avatar
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('discipleship_files')
            .getPublicUrl(filePath);

        // Append cache-busting param so the browser reloads the image
        return `${data.publicUrl}?t=${Date.now()}`;
    },


    async getPrivateConnection(user1Id: string, user2Id: string): Promise<any | null> {
        // Find existing connection in either direction
        const { data, error } = await supabase
            .from('discipleship_connections')
            .select(`
                *,
                disciple_profile:disciple_id (username, avatar_url),
                leader_profile:leader_id (username, avatar_url)
            `)
            .or(`and(leader_id.eq.${user1Id},disciple_id.eq.${user2Id}),and(leader_id.eq.${user2Id},disciple_id.eq.${user1Id})`)
            .maybeSingle();
        
        if (error) return null;
        if (data) {
            // Normalize for UI
            const isUser1Leader = data.leader_id === user1Id;
            return {
                ...data,
                type: isUser1Leader ? 'disciple' : 'leader',
                profile: isUser1Leader ? data.disciple_profile : data.leader_profile
            };
        }
        return null;
    },

    async leaveGroup(groupId: string, userId: string, username: string): Promise<void> {
        // Enviar mensagem de sistema antes de sair
        const { data: group } = await supabase.from('discipleship_groups').select('leader_id').eq('id', groupId).single();
        if (group) {
            await this.addNote(group.leader_id, null, userId, `[SYSTEM]: ${username} saiu do grupo.`, groupId);
        }
        await this.removeGroupMember(groupId, userId);
    },

    async removeGroupMember(groupId: string, userId: string, targetUsername?: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (targetUsername && user) {
            const { data: group } = await supabase.from('discipleship_groups').select('leader_id').eq('id', groupId).single();
            if (group) {
                await this.addNote(group.leader_id, null, user.id, `[SYSTEM]: ${targetUsername} foi removido do grupo.`, groupId);
            }
        }

        const { error } = await supabase
            .from('discipleship_group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);
        
        if (error) throw error;
    },

    async updateMemberRole(memberId: string, role: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_group_members')
            .update({ role })
            .eq('id', memberId);
        
        if (error) throw error;
    },

    async transferGroupLeadership(groupId: string, newLeaderId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        
        // 1. Update the group's leader_id
        const { error: groupError } = await supabase
            .from('discipleship_groups')
            .update({ leader_id: newLeaderId })
            .eq('id', groupId);
        
        if (groupError) throw groupError;

        // 2. Make sure the new leader has the admin role
        await supabase
            .from('discipleship_group_members')
            .update({ role: 'admin' })
            .eq('group_id', groupId)
            .eq('user_id', newLeaderId);

        // 3. Ensure the old leader (current user) becomes a co-leader
        if (user && user.id !== newLeaderId) {
            await supabase
                .from('discipleship_group_members')
                .update({ role: 'admin' })
                .eq('group_id', groupId)
                .eq('user_id', user.id);
        }
    },

    async getOrCreateConnection(userId1: string, userId2: string): Promise<any> {
        // Find existing connection in both directions
        const { data: existing, error: searchError } = await supabase
            .from('discipleship_connections')
            .select(`
                *,
                profiles:disciple_id (username, avatar_url)
            `)
            .or(`and(leader_id.eq.${userId1},disciple_id.eq.${userId2}),and(leader_id.eq.${userId2},disciple_id.eq.${userId1})`)
            .maybeSingle();

        if (existing) return existing;

        // Create new active connection (userId1 as leader by default if new)
        const { data: created, error: createError } = await supabase
            .from('discipleship_connections')
            .insert({ leader_id: userId1, disciple_id: userId2, status: 'active' })
            .select(`
                *,
                profiles:disciple_id (username, avatar_url)
            `)
            .single();
        
        if (createError) throw createError;
        return created;
    },

    async updateGroupAvatar(groupId: string, avatarUrl: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_groups')
            .update({ avatar_url: avatarUrl })
            .eq('id', groupId);
        
        if (error) throw error;
    },

    async respondToGroupInvite(memberId: string, accept: boolean): Promise<void> {
        if (accept) {
            // Get member details to send system message
            const { data: member } = await supabase
                .from('discipleship_group_members')
                .select('user_id, group_id, profiles:user_id(username), group:group_id(leader_id)')
                .eq('id', memberId)
                .single();

            if (member) {
                const username = (member.profiles as any)?.username || 'Um usuário';
                const groupId = member.group_id;
                const groupLeaderId = (member.group as any)?.leader_id;
                
                await this.addNote(groupLeaderId, null, member.user_id, `[SYSTEM]: ${username} entrou no grupo.`, groupId);
            }
        }

        const { error } = await supabase
            .from('discipleship_group_members')
            .update({ status: accept ? 'active' : 'inactive' })
            .eq('id', memberId);
        
        if (error) throw error;
    },

    async getGroups(userId: string): Promise<any[]> {
        // Fetch all group memberships with group details
        const { data, error } = await supabase
            .from('discipleship_group_members')
            .select('*, group:group_id (*)')
            .eq('user_id', userId);
        
        if (error) return [];
        
        return (data || []).map(m => ({
            ...m.group,
            type: m.group.leader_id === userId ? 'leader' : 'member',
            member_status: m.status,
            member_id: m.id
        }));
    },

    async getGroupMembers(groupId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('discipleship_group_members')
            .select('*, profiles:user_id (*)')
            .eq('group_id', groupId);
        
        if (error) return [];
        return data || [];
    },

    async getNotificationCount(userId: string): Promise<number> {
        // Unread notes where the user is NOT the author
        const { count: notesCount, error: notesError } = await supabase
            .from('discipleship_notes')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false)
            .neq('author_id', userId)
            .or(`leader_id.eq.${userId},disciple_id.eq.${userId}`);
        
        // Pending invitations for the user as a disciple
        const { count: invitesCount, error: invitesError } = await supabase
            .from('discipleship_connections')
            .select('*', { count: 'exact', head: true })
            .eq('disciple_id', userId)
            .eq('status', 'pending');

        // Pending group invitations
        const { count: groupInvitesCount, error: groupInvitesError } = await supabase
            .from('discipleship_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'pending');
        
        if (notesError || invitesError || groupInvitesError) return 0;
        return (notesCount || 0) + (invitesCount || 0) + (groupInvitesCount || 0);
    },

    async markNotesAsRead(leaderId: string, discipleId: string | null, readerId: string, groupId: string | null = null): Promise<void> {
        let query = supabase
            .from('discipleship_notes')
            .update({ is_read: true })
            .neq('author_id', readerId)
            .eq('is_read', false);
        
        if (groupId) {
            query = query.eq('group_id', groupId);
        } else {
            query = query.eq('leader_id', leaderId).eq('disciple_id', discipleId).is('group_id', null);
        }
        
        const { error } = await query;
        if (error) console.error('Error marking notes as read:', error);
    },

    async getRecentNotifications(userId: string): Promise<any[]> {
        const notifications: any[] = [];

        // 1. Unread messages (notes) sent by others to this user
        const { data: unreadNotes } = await supabase
            .from('discipleship_notes')
            .select('*, profiles:author_id(username, avatar_url)')
            .eq('is_read', false)
            .neq('author_id', userId)
            .or(`leader_id.eq.${userId},disciple_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(10);

        if (unreadNotes) {
            unreadNotes.forEach(note => {
                const sender = (note.profiles as any);
                notifications.push({
                    id: `note-${note.id}`,
                    type: 'message',
                    title: sender?.username || 'Alguém',
                    body: note.file_url ? '📎 Enviou um arquivo' : (note.content?.slice(0, 60) + (note.content?.length > 60 ? '…' : '') || ''),
                    avatar_url: sender?.avatar_url || null,
                    created_at: note.created_at,
                    action: '/discipleship',
                });
            });
        }

        // 2. Pending discipleship connection invites
        const { data: pendingConnections } = await supabase
            .from('discipleship_connections')
            .select('*, profiles:leader_id(username, avatar_url)')
            .eq('disciple_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (pendingConnections) {
            pendingConnections.forEach(conn => {
                const sender = (conn.profiles as any);
                notifications.push({
                    id: `conn-${conn.id}`,
                    type: 'invite',
                    title: sender?.username || 'Alguém',
                    body: 'te convidou para ser discípulo',
                    avatar_url: sender?.avatar_url || null,
                    created_at: conn.created_at,
                    action: '/discipleship',
                });
            });
        }

        // 3. Pending group invites
        const { data: pendingGroupInvites } = await supabase
            .from('discipleship_group_members')
            .select('*, group:group_id(name, avatar_url)')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (pendingGroupInvites) {
            pendingGroupInvites.forEach(inv => {
                const group = (inv.group as any);
                notifications.push({
                    id: `group-${inv.id}`,
                    type: 'group_invite',
                    title: group?.name || 'Grupo',
                    body: 'você foi convidado para este grupo',
                    avatar_url: group?.avatar_url || null,
                    created_at: inv.created_at,
                    action: '/discipleship',
                });
            });
        }

        // Sort all by date desc
        notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return notifications.slice(0, 15);
    },

    async getUnreadCounts(userId: string): Promise<Record<string, number>> {
        // Fetch group memberships to filter unread group notes
        const { data: groupMemberships } = await supabase
            .from('discipleship_group_members')
            .select('group_id')
            .eq('user_id', userId)
            .eq('status', 'active');
        
        const groupIds = groupMemberships?.map(m => m.group_id) || [];

        let query = supabase
            .from('discipleship_notes')
            .select('leader_id, disciple_id, group_id')
            .eq('is_read', false)
            .neq('author_id', userId);
        
        // Filter notes relevant to the user (private or in their groups)
        if (groupIds.length > 0) {
            query = query.or(`leader_id.eq.${userId},disciple_id.eq.${userId},group_id.in.(${groupIds.join(',')})`);
        } else {
            query = query.or(`leader_id.eq.${userId},disciple_id.eq.${userId}`);
        }

        const { data: notes, error } = await query;
        if (error || !notes) return {};

        const counts: Record<string, number> = {};
        notes.forEach(note => {
            const key = note.group_id || (note.leader_id === userId ? note.disciple_id : note.leader_id);
            if (key) {
                counts[key] = (counts[key] || 0) + 1;
            }
        });
        return counts;
    }
};
