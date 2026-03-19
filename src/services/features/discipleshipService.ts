import { supabase } from '../supabase';

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
    type: 'chapter' | 'plan' | 'other';
    target_id: string | null;
    is_completed: boolean;
    created_at: string;
}

export interface DiscipleshipNote {
    id: string;
    leader_id: string;
    disciple_id: string;
    author_id: string;
    content: string;
    created_at: string;
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
            .eq('status', 'active');
        
        if (error) {
            console.error('Error fetching disciples:', error);
            return [];
        }
        return data || [];
    },

    async getLeader(discipleId: string): Promise<any | null> {
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
            .eq('status', 'active')
            .maybeSingle();
        
        if (error) return null;
        return data || null;
    },

    // Task Management
    async assignTask(leaderId: string, discipleId: string, title: string, type: string, targetId?: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_tasks')
            .insert({ leader_id: leaderId, disciple_id: discipleId, title, type, target_id: targetId });
        
        if (error) throw error;
    },

    async getTasks(userId: string, isLeader: boolean): Promise<DiscipleshipTask[]> {
        let query = supabase.from('discipleship_tasks').select('*');
        if (isLeader) {
            query = query.eq('leader_id', userId);
        } else {
            query = query.eq('disciple_id', userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return [];
        return data || [];
    },

    async completeTask(taskId: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_tasks')
            .update({ is_completed: true })
            .eq('id', taskId);
        
        if (error) throw error;
    },

    // Notes Management
    async addNote(leaderId: string, discipleId: string | null, authorId: string, content: string, groupId: string | null = null): Promise<void> {
        const { error } = await supabase
            .from('discipleship_notes')
            .insert({ 
                leader_id: leaderId, 
                disciple_id: discipleId, 
                author_id: authorId, 
                content,
                group_id: groupId 
            });
        
        if (error) throw error;
    },

    async getNotes(leaderId: string, discipleId: string | null, groupId: string | null = null): Promise<DiscipleshipNote[]> {
        let query = supabase.from('discipleship_notes').select('*');
        
        if (groupId) {
            query = query.eq('group_id', groupId);
        } else {
            query = query.eq('leader_id', leaderId).eq('disciple_id', discipleId).is('group_id', null);
        }
        
        const { data, error } = await query.order('created_at', { ascending: true });
        
        if (error) return [];
        return data || [];
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

    // Group Management
    async createGroup(leaderId: string, name: string): Promise<string> {
        const { data, error } = await supabase
            .from('discipleship_groups')
            .insert({ leader_id: leaderId, name })
            .select()
            .single();
        
        if (error) throw error;

        // Auto-add leader as an active member
        await supabase
            .from('discipleship_group_members')
            .insert({ group_id: data.id, user_id: leaderId, status: 'active' });
        
        return data.id;
    },

    async inviteToGroup(groupId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_group_members')
            .upsert({ group_id: groupId, user_id: userId, status: 'pending' }, { onConflict: 'group_id,user_id' });
        
        if (error) throw error;
    },

    async respondToGroupInvite(memberId: string, accept: boolean): Promise<void> {
        const { error } = await supabase
            .from('discipleship_group_members')
            .update({ status: accept ? 'active' : 'inactive' })
            .eq('id', memberId);
        
        if (error) throw error;
    },

    async getGroups(userId: string): Promise<any[]> {
        // Groups where I am the leader
        const { data: leadGroups, error: leadError } = await supabase
            .from('discipleship_groups')
            .select('*')
            .eq('leader_id', userId);
        
        // Groups where I am a member (any status)
        const { data: memberGroups, error: memberError } = await supabase
            .from('discipleship_group_members')
            .select('*, group:group_id (*)')
            .eq('user_id', userId);
        
        if (leadError || memberError) return [];
        
        const allGroups = [
            ...(leadGroups || []).map(g => ({ ...g, type: 'leader' })),
            ...(memberGroups || []).map(m => ({ ...m.group, type: 'member', member_status: m.status, member_id: m.id }))
        ];
        
        return allGroups;
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
    }
};
