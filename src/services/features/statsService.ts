import { STATIC_BOOKS } from '../bible/staticBibleData';
import { supabase } from '../supabase';

const READ_CHAPTERS_KEY = 'oneflow_read_chapters';

export interface BibleStats {
    totalChaptersRead: number;
    completionPercentage: number;
    booksTouched: number;
    estimatedMinutes: number;
    hoursRead: number;
}

export const statsService = {
    getReadChapters(): string[] {
        const data = localStorage.getItem(READ_CHAPTERS_KEY);
        return data ? JSON.parse(data) : [];
    },

    async toggleChapterRead(bookAbbrev: string, chapter: number): Promise<boolean> {
        const chapters = this.getReadChapters();
        const key = `${bookAbbrev}:${chapter}`;
        const index = chapters.indexOf(key);

        let isRead = false;
        if (index > -1) {
            chapters.splice(index, 1);
            isRead = false;
            
            // Sync to Supabase if logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('reading_progress')
                    .delete()
                    .match({ user_id: user.id, book_abbrev: bookAbbrev, chapter_number: chapter });
            }
        } else {
            chapters.push(key);
            isRead = true;

            // Sync to Supabase if logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('reading_progress')
                    .upsert({ user_id: user.id, book_abbrev: bookAbbrev, chapter_number: chapter });
                
                // Trigger auto-completion of pending reading tasks globally (so we don't end up with circular dependencies here, we can dispatch an event or handle it in the component. Actually, a direct import might cause circular deps. Let's try dynamic import to be safe).
                import('./discipleshipService').then(m => m.discipleshipService.checkAndSyncReadingTasks(user.id)).catch(console.error);
            }
        }

        localStorage.setItem(READ_CHAPTERS_KEY, JSON.stringify(chapters));
        return isRead;
    },

    isChapterRead(bookAbbrev: string, chapter: number): boolean {
        const chapters = this.getReadChapters();
        return chapters.includes(`${bookAbbrev}:${chapter}`);
    },

    async getUserStats(userId?: string): Promise<BibleStats> {
        let readChapters: string[] = [];
        const totalChapters = 1189;

        if (userId) {
            // Fetch from Supabase for specific user (for discipleship)
            const { data, error } = await supabase
                .from('reading_progress')
                .select('book_abbrev, chapter_number')
                .eq('user_id', userId);
            
            if (!error && data) {
                readChapters = data.map(rp => `${rp.book_abbrev}:${rp.chapter_number}`);
            }
        } else {
            // Default to local chapters
            readChapters = this.getReadChapters();
        }

        const booksMap = new Map<string, number[]>();
        readChapters.forEach(entry => {
            const [book] = entry.split(':');
            if (!booksMap.has(book)) booksMap.set(book, []);
        });

        const estimatedMinutes = readChapters.length * 4; // Avg 4 mins per chapter

        return {
            totalChaptersRead: readChapters.length,
            completionPercentage: (readChapters.length / totalChapters) * 100,
            booksTouched: booksMap.size,
            estimatedMinutes,
            hoursRead: Math.floor(estimatedMinutes / 60)
        };
    },

    // Kept for backward compatibility if needed, but uses getUserStats internally
    getStats(): BibleStats {
        const readChapters = this.getReadChapters();
        const totalChapters = 1189;
        const booksMap = new Map<string, number[]>();
        readChapters.forEach(entry => {
            const [book] = entry.split(':');
            if (!booksMap.has(book)) booksMap.set(book, []);
        });
        const estimatedMinutes = readChapters.length * 4;
        return {
            totalChaptersRead: readChapters.length,
            completionPercentage: (readChapters.length / totalChapters) * 100,
            booksTouched: booksMap.size,
            estimatedMinutes,
            hoursRead: Math.floor(estimatedMinutes / 60)
        };
    },

    getLastReadBook(): string | null {
        const chapters = this.getReadChapters();
        if (chapters.length === 0) return null;
        const last = chapters[chapters.length - 1];
        return last.split(':')[0];
    },

    isBookCompleted(bookAbbrev: string): boolean {
        const book = STATIC_BOOKS.find(b => b.abbrev.pt === bookAbbrev);
        if (!book) return false;

        const chapters = this.getReadChapters();
        let readCount = 0;
        
        for (const chapterKey of chapters) {
            if (chapterKey.startsWith(`${bookAbbrev}:`)) {
                readCount++;
            }
        }
        
        return readCount >= book.chapters;
    }
};
