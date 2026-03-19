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

    // Notes Management
    async addNote(leaderId: string, discipleId: string | null, authorId: string, content: string, groupId: string | null = null, file: { url: string; name: string; type: string } | null = null): Promise<void> {
        const { error } = await supabase
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
            });
        
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

    async getNotes(leaderId: string, discipleId: string | null, groupId: string | null = null): Promise<DiscipleshipNote[]> {
        let query = supabase.from('discipleship_notes').select('*, profiles:author_id(*)');
        
        if (groupId) {
            query = query.eq('group_id', groupId);
        } else {
            query = query.eq('leader_id', leaderId).eq('disciple_id', discipleId).is('group_id', null);
        }
        
        const { data, error } = await query.order('created_at', { ascending: true });
        
        if (error) {
            console.error('Error fetching notes:', error);
            return [];
        }
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
            .insert({ group_id: data.id, user_id: leaderId, status: 'active', role: 'admin' });
        
        return data.id;
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
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `notes/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('discipleship_files')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('discipleship_files')
            .getPublicUrl(filePath);

        return {
            url: data.publicUrl,
            name: file.name,
            type: file.type
        };
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

    async leaveGroup(groupId: string, userId: string): Promise<void> {
        await this.removeGroupMember(groupId, userId);
    },

    async removeGroupMember(groupId: string, userId: string): Promise<void> {
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
