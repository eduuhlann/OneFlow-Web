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
    async addNote(leaderId: string, discipleId: string, authorId: string, content: string): Promise<void> {
        const { error } = await supabase
            .from('discipleship_notes')
            .insert({ leader_id: leaderId, disciple_id: discipleId, author_id: authorId, content });
        
        if (error) throw error;
    },

    async getNotes(leaderId: string, discipleId: string): Promise<DiscipleshipNote[]> {
        const { data, error } = await supabase
            .from('discipleship_notes')
            .select('*')
            .eq('leader_id', leaderId)
            .eq('disciple_id', discipleId)
            .order('created_at', { ascending: true });
        
        if (error) return [];
        return data || [];
    }
};
