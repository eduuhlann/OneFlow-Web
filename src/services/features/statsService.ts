import { STATIC_BOOKS } from '../bible/staticBibleData';

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

    toggleChapterRead(bookAbbrev: string, chapter: number): boolean {
        const chapters = this.getReadChapters();
        const key = `${bookAbbrev}:${chapter}`;
        const index = chapters.indexOf(key);

        let isRead = false;
        if (index > -1) {
            chapters.splice(index, 1);
            isRead = false;
        } else {
            chapters.push(key);
            isRead = true;
        }

        localStorage.setItem(READ_CHAPTERS_KEY, JSON.stringify(chapters));
        return isRead;
    },

    isChapterRead(bookAbbrev: string, chapter: number): boolean {
        const chapters = this.getReadChapters();
        return chapters.includes(`${bookAbbrev}:${chapter}`);
    },

    getStats(): BibleStats {
        const readChapters = this.getReadChapters();
        const totalChapters = 1189;

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

    getLastReadBook(): string | null {
        const chapters = this.getReadChapters();
        if (chapters.length === 0) return null;
        const last = chapters[chapters.length - 1];
        return last.split(':')[0];
    }
};
