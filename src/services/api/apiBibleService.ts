export const apiBibleService = {
  baseUrl: 'https://api.scripture.api.bible/v1',

  get apiKey() {
    return import.meta.env.VITE_BIBLE_API_KEY || '';
  },

  get headers() {
    return {
      'api-key': this.apiKey,
      'Accept': 'application/json'
    };
  },

  async getBibles(): Promise<any[]> {
    if (!this.apiKey) {
      console.error('ERRO: API Key não encontrada no arquivo .env');
      return [];
    }
    try {
      const resp = await fetch(`${this.baseUrl}/bibles?language=por`, { headers: this.headers });
      if (!resp.ok) {
        // Isso vai mostrar se é erro 401, 404, etc.
        console.error(`ERRO HTTP em getBibles: ${resp.status} - ${resp.statusText}`);
        const errorDetails = await resp.text();
        console.error('Detalhes do erro:', errorDetails);
        return [];
      }
      const data = await resp.json();
      return data.data || [];
    } catch (error) {
      // Isso captura erros de rede ou de CORS
      console.error('ERRO DE REDE/CORS em getBibles:', error);
      return [];
    }
  },

  async getChapterAndVerses(bibleId: string, bookAbbrev: string, chapterNum: number): Promise<any> {
    if (!this.apiKey) return null;
    try {
      const bookId = this.mapLocalToApiBibleBook(bookAbbrev);
      const chapterId = `${bookId}.${chapterNum}`;

      const resp = await fetch(`${this.baseUrl}/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-verse-numbers=true`, { headers: this.headers });

      if (!resp.ok) {
        console.error(`ERRO HTTP em getChapterAndVerses: ${resp.status}`);
        console.error('URL tentada:', resp.url);
        return null;
      }

      const data = await resp.json();
      return data.data;
    } catch (error) {
      console.error('ERRO DE REDE/CORS em getChapterAndVerses:', error);
      return null;
    }
  },

  mapLocalToApiBibleBook(abbrev: string): string {
    const map: Record<string, string> = {
      'gn': 'GEN', 'ex': 'EXO', 'lv': 'LEV', 'nm': 'NUM', 'dt': 'DEU',
      'js': 'JOS', 'jz': 'JDG', 'rt': 'RUT', '1sm': '1SA', '2sm': '2SA',
      '1rs': '1KI', '2rs': '2KI', '1cr': '1CH', '2cr': '2CH', 'ed': 'EZR',
      'ne': 'NEH', 'et': 'EST', 'job': 'JOB', 'sl': 'PSA', 'pv': 'PRO',
      'ec': 'ECC', 'ct': 'SNG', 'is': 'ISA', 'jr': 'JER', 'lm': 'LAM',
      'ez': 'EZK', 'dn': 'DAN', 'os': 'HOS', 'jl': 'JOL', 'am': 'AMO',
      'ob': 'OBA', 'jn': 'JON', 'mq': 'MIC', 'na': 'NAM', 'hc': 'HAB',
      'sf': 'ZEP', 'ag': 'HAG', 'zc': 'ZEC', 'ml': 'MAL',
      'mt': 'MAT', 'mc': 'MRK', 'lc': 'LUK', 'jo': 'JHN', 'at': 'ACT',
      'rm': 'ROM', '1co': '1CO', '2co': '2CO', 'gl': 'GAL', 'ef': 'EPH',
      'fp': 'PHP', 'cl': 'COL', '1ts': '1TH', '2ts': '2TH', '1tm': '1TI',
      '2tm': '2TI', 'tt': 'TIT', 'fm': 'PHM', 'hb': 'HEB', 'tg': 'JAS',
      '1pe': '1PE', '2pe': '2PE', '1jo': '1JN', '2jo': '2JN', '3jo': '3JN',
      'jd': 'JUD', 'ap': 'REV'
    };
    return map[abbrev.toLowerCase()] || 'GEN';
  }
};