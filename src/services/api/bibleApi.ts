import { Book, Chapter, Verse } from '../../types';
import { offlineBible } from '../bible/offlineBible';
import { STATIC_BOOKS } from '../bible/staticBibleData';

export const bibleApi = {
    getVerse: (bookAbbrev: string, chapter: number, verse: number): string | null => {
        try {
            const chapterData = offlineBible.getChapter(bookAbbrev, chapter);
            if (!chapterData || !chapterData.verses[verse - 1]) return null;
            return chapterData.verses[verse - 1].text;
        } catch (error) {
            console.error('Error getting verse:', error);
            return null;
        }
    },

    async getBooks(): Promise<Book[]> {
        return STATIC_BOOKS;
    },

    async getChapter(bookAbbrev: string, chapter: number, version: string = 'nvi'): Promise<Chapter | null> {
        // Only NVI is currently supported offline in this port
        if (version === 'nvi' || version === 'NVI') {
            const offlineData = offlineBible.getChapter(bookAbbrev, chapter);
            if (offlineData) return offlineData;
        }

        const cacheKey = `@bible_cache_${version}_${bookAbbrev}_${chapter}`;
        try {
            const cachedBody = localStorage.getItem(cacheKey);
            if (cachedBody) {
                const parsed = JSON.parse(cachedBody);
                if (parsed && typeof parsed === 'object') return parsed;
            }
        } catch (e) {
            console.warn('Error reading from cache (corrupted storage?):', e);
            localStorage.removeItem(cacheKey); // Clean up corrupted data
        }

        try {
            const response = await fetch(`https://www.abibliadigital.com.br/api/verses/${version}/${bookAbbrev.toLowerCase()}/${chapter}`);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();

            const verses: Verse[] = data.verses.map((v: any) => ({
                book: {
                    abbrev: { pt: bookAbbrev, en: bookAbbrev },
                    name: data.book.name,
                    author: data.book.author,
                    group: data.book.group,
                    version: version
                },
                chapter: chapter,
                number: v.number,
                text: v.text
            }));

            const staticBook = STATIC_BOOKS.find(b => b.abbrev.pt === bookAbbrev.toLowerCase());

            const result: Chapter = {
                book: {
                    abbrev: { pt: bookAbbrev, en: bookAbbrev },
                    name: data.book.name,
                    author: data.book.author,
                    group: data.book.group,
                    version: version,
                    chapters: data.book.chapters || 0,
                    description: staticBook?.description
                },
                chapter: {
                    number: chapter,
                    verses: verses.length
                },
                verses: verses
            };

            try {
                localStorage.setItem(cacheKey, JSON.stringify(result));
            } catch (e) {
                console.warn('Error saving to cache:', e);
            }

            return result;
        } catch (error) {
            console.warn(`⚠️ Error loading chapter ${bookAbbrev} ${chapter} [${version}]:`, error);
            // Fallback to offline NVI
            return offlineBible.getChapter(bookAbbrev, chapter);
        }
    },

    async getVersions(): Promise<any[]> {
        try {
            const response = await fetch('https://www.abibliadigital.com.br/api/versions');
            if (!response.ok) throw new Error('Failed to fetch versions');
            return await response.json();
        } catch (error) {
            return [
                { version: 'nvi' },
                { version: 'ra' },
                { version: 'acf' }
            ];
        }
    }
};
