export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface ChatThread {
    id: string;
    title: string;
    lastMessage: string;
    updatedAt: number;
}

const STORAGE_KEY = 'oneflow_chat_messages';
const THREAD_KEY = 'oneflow_chat_threads';

export const chatStorage = {
    async getMessages(threadId: string): Promise<ChatMessage[]> {
        const data = localStorage.getItem(`${STORAGE_KEY}_${threadId}`);
        return data ? JSON.parse(data) : [];
    },

    async saveMessage(threadId: string, message: ChatMessage) {
        const messages = await this.getMessages(threadId);
        messages.push(message);
        localStorage.setItem(`${STORAGE_KEY}_${threadId}`, JSON.stringify(messages));

        // Update thread
        const threads = await this.getThreads();
        const threadIndex = threads.findIndex(t => t.id === threadId);
        if (threadIndex > -1) {
            threads[threadIndex].lastMessage = message.content;
            threads[threadIndex].updatedAt = Date.now();
            localStorage.setItem(THREAD_KEY, JSON.stringify(threads));
        }
    },

    async getThreads(): Promise<ChatThread[]> {
        const data = localStorage.getItem(THREAD_KEY);
        return data ? JSON.parse(data) : [];
    },

    async createThread(title: string): Promise<string> {
        const id = Math.random().toString(36).substring(7);
        const thread: ChatThread = {
            id,
            title,
            lastMessage: '',
            updatedAt: Date.now()
        };
        const threads = await this.getThreads();
        threads.unshift(thread);
        localStorage.setItem(THREAD_KEY, JSON.stringify(threads));
        return id;
    },

    async clearMessages(threadId: string) {
        localStorage.removeItem(`${STORAGE_KEY}_${threadId}`);
    },

    async deleteThread(threadId: string) {
        // Remove messages
        await this.clearMessages(threadId);
        
        // Remove thread from list
        const threads = await this.getThreads();
        const filtered = threads.filter(t => t.id !== threadId);
        localStorage.setItem(THREAD_KEY, JSON.stringify(filtered));
    },

    async updateThreadTitle(threadId: string, title: string) {
        const threads = await this.getThreads();
        const index = threads.findIndex(t => t.id === threadId);
        if (index > -1) {
            threads[index].title = title;
            threads[index].updatedAt = Date.now();
            localStorage.setItem(THREAD_KEY, JSON.stringify(threads));
        }
    }
};
