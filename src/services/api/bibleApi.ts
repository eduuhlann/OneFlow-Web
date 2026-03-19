import { Book, Chapter, Verse } from '../../types';
import { offlineBible } from '../bible/offlineBible';
import { STATIC_BOOKS } from '../bible/staticBibleData';

// Available working versions
const WORKING_VERSIONS = [
    { version: 'nvi', name: 'NVI — Nova Versão Internacional' },
    { version: 'almeida', name: 'João Ferreira de Almeida' },
];

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
        // NVI — 100% offline
        if (version.toLowerCase() === 'nvi') {
            return offlineBible.getChapter(bookAbbrev, chapter);
        }

        // Almeida via bible-api.com (free, no key needed)
        if (version.toLowerCase() === 'almeida') {
            const cacheKey = `@bible_cache_almeida_${bookAbbrev}_${chapter}`;

            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && typeof parsed === 'object') return parsed;
                }
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }

            try {
                const bookMeta = STATIC_BOOKS.find(b => b.abbrev.pt === bookAbbrev.toLowerCase());
                const engAbbrev = bookMeta?.abbrev.en || bookAbbrev;

                const response = await fetch(`https://bible-api.com/${engAbbrev}%20${chapter}?translation=almeida`);
                if (!response.ok) throw new Error(`bible-api.com error: ${response.status}`);
                const data = await response.json();

                if (!data?.verses?.length) throw new Error('No verses in response');

                const verses: Verse[] = data.verses.map((v: any) => ({
                    book: {
                        abbrev: { pt: bookAbbrev, en: engAbbrev },
                        name: data.verses[0].book_name,
                        author: '',
                        group: '',
                        version: 'almeida'
                    },
                    chapter: chapter,
                    number: v.verse,
                    text: v.text.trim()
                }));

                const result: Chapter = {
                    book: {
                        abbrev: { pt: bookAbbrev, en: engAbbrev },
                        name: data.verses[0].book_name,
                        author: '',
                        group: '',
                        version: 'almeida',
                        chapters: bookMeta?.chapters || 0,
                        description: bookMeta?.description
                    },
                    chapter: { number: chapter, verses: verses.length },
                    verses
                };

                try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (e) {}
                return result;
            } catch (err) {
                console.error('bible-api.com (Almeida) failed:', err);
                throw new Error('Não foi possível carregar a versão Almeida. Verifique sua conexão.');
            }
        }

        // Unknown version — graceful fallback to NVI
        return offlineBible.getChapter(bookAbbrev, chapter);
    },

    async getVersions(): Promise<any[]> {
        return WORKING_VERSIONS;
    }
};
