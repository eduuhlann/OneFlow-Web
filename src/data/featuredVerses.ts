export interface FeaturedVerse {
    id: string;
    reference: string;
    text: string;
    theme: string;
}

/**
 * Versículos sugerido para fixar no perfil. Textos de domínio
 * público (Almeida Revista e Corrigida / traduções clássicas).
 */
export const FEATURED_VERSES: FeaturedVerse[] = [
    { id: 'joao-3-16', reference: 'João 3:16', theme: 'Amor', text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo o que nele crê não pereça, mas tenha a vida eterna.' },
    { id: 'salmos-23-1', reference: 'Salmos 23:1', theme: 'Confiança', text: 'O SENHOR é o meu pastor; nada me faltará.' },
    { id: 'isaías-40-31', reference: 'Isaías 40:31', theme: 'Força', text: 'Mas os que esperam no SENHOR renovarão as suas forças; subirão como abutres; correrão, e não se cansarão; caminharão, e não se fatigarão.' },
    { id: 'provérbios-3-5', reference: 'Provérbios 3:5', theme: 'Sabedoria', text: 'Confia no SENHOR de todo o teu coração e não te estribes no teu próprio entendimento.' },
    { id: 'filipenses-4-13', reference: 'Filipenses 4:13', theme: 'Força', text: 'Posso todas as coisas naquele que me fortalece.' },
    { id: 'maria-6-33', reference: 'Mateus 6:33', theme: 'Prioridades', text: 'Mas buscai primeiro o reino de Deus e a sua justiça; e todas essas coisas te serão acrescentadas.' },
    { id: 'efésios-2-8', reference: 'Efésios 2:8', theme: 'Graça', text: 'Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus.' },
    { id: '1cor-13-13', reference: '1 Coríntios 13:13', theme: 'Amor', text: 'Agora, pois, permanecem a fé, a esperança e o amor, os três; mas o maior deles é o amor.' },
    { id: 'salmos-119-105', reference: 'Salmos 119:105', theme: 'Palavra', text: 'A tua palavra é a lâmpada para os meus pés, e a luz para o meu caminho.' },
    { id: '2tim-3-16', reference: '2 Timóteo 3:16', theme: 'Palavra', text: 'Toda a Escritura é divinamente inspirada e proveitosa para ensinar, para redargir, para corrigir, para instruir em justiça.' },
    { id: 'tiago-1-22', reference: 'Tiago 1:22', theme: 'Prática', text: 'Sede praticantes da palavra, e não tanentes somente, enganando a vós mesmos.' },
    { id: 'galatas-5-22', reference: 'Gálatas 5:22', theme: 'Fruto', text: 'Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, humildade, temperança.' },
    { id: 'mateus-11-28', reference: 'Mateus 11:28', theme: 'Descanso', text: 'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.' },
    { id: 'hebreus-11-1', reference: 'Hebreus 11:1', theme: 'Fé', text: 'Ora, a fé é a certeza das coisas esperadas, a convicção dos fatos que não vemos.' },
    { id: 'colossenses-3-23', reference: 'Colossenses 3:23', theme: 'Dedicação', text: 'E, quanto fizerdes, fazei-o de todo o coração, como quem trabalha para o Senhor, e não para homens.' },
    { id: '1pedro-5-7', reference: '1 Pedro 5:7', theme: 'Entrega', text: 'Lançai sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.' },
    { id: 'salmos-46-1', reference: 'Salmos 46:1', theme: 'Refúgio', text: 'Deus é refúgio e fortaleza, socorro bem presente na angústia; portanto não temas, quando vier a tribulação.' },
    { id: 'isaías-40-8', reference: 'Isaías 40:8', theme: 'Eternidade', text: 'Seca-se a erva, cai a flor; mas a palavra do nosso Deus permanece para sempre.' },
    { id: 'joão-14-6', reference: 'João 14:6', theme: 'Caminho', text: 'Disse-lhe Jesus: Eu sou o caminho, a verdade e a vida; ninguém vem ao Pai, senão por mim.' },
    { id: '1joão-4-19', reference: '1 João 4:19', theme: 'Amor', text: 'Nós amamos porque ele primeiro nos amou.' },
    { id: 'mateus-5-14', reference: 'Mateus 5:14', theme: 'Luz', text: 'Vós sois a luz do mundo; não pode estar a cidade escondida, e está edificada sobre um monte.' },
    { id: 'lucas-6-31', reference: 'Lucas 6:31', theme: 'Misericórdia', text: 'E como quereis que os homens vos façam, fazei-lhes vós também assim.' },
    { id: '1tess-5-16', reference: '1 Tessalonicenses 5:16-18', theme: 'Alegria', text: 'Regozijai-vos sempre. Orai sem cessar. Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.' },
    { id: 'provérbios-18-10', reference: 'Provérbios 18:10', theme: 'Segurança', text: 'Torre forte é o nome do Senhor; nele correrá o justo, e será exalçado.' },
    { id: 'marcos-10-27', reference: 'Marcos 10:27', theme: 'Possibilidade', text: 'Para homem é impossível, mas não para Deus; porque para Deus tudo é possível.' },
    { id: 'joão-8-32', reference: 'João 8:32', theme: 'Liberdade', text: 'E conheceréis a verdade, e a verdade vos tornará livres.' },
    { id: 'josué-24-15', reference: 'Josué 24:15', theme: 'Escolha', text: 'Escolhei hoje a quem servis; mas eu e a minha casa serviremos ao Senhor.' },
    { id: 'romanos-12-2', reference: 'Romanos 12:2', theme: 'Renovação', text: 'Não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento, para que experimenteis qual seja a boa, agradável e perfeita vontade de Deus.' },
    { id: 'mateus-6-21', reference: 'Mateus 6:21', theme: 'Coração', text: 'Porque onde está o teu tesouro, ali está também o teu coração.' },
    { id: 'efésios-4-32', reference: 'Efésios 4:32', theme: 'Bondade', text: 'Sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros, como Deus vos perdoou em Cristo.' },
    { id: '1joão-1-9', reference: '1 João 1:9', theme: 'Perdão', text: 'Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda a injustiça.' },
    { id: 'hebreus-13-8', reference: 'Hebreus 13:8', theme: 'Permanência', text: 'Jesus Cristo é o mesmo ontem, hoje e eternamente.' },
    { id: 'galatas-6-9', reference: 'Gálatas 6:9', theme: 'Persistência', text: 'Não deixes de fazer o bem; se te cansares, não te desfaltes, porque atrás virá a colheita.' },
    { id: 'joão-15-5', reference: 'João 15:5', theme: 'União', text: 'Eu sou a videira; vós sois os ramos. Quem permanece em mim, e eu nele, este dá fruto, porque fora de mim não podeis fazer nada.' },
    { id: 'isaías-40-29', reference: 'Isaías 40:29', theme: 'Fôlego', text: 'Ele dá força aos cansados e multiplica as forças aos que não têm força.' },
    { id: 'salmos-121-1', reference: 'Salmos 121:1-2', theme: 'Socorro', text: 'Levanto os meus olhos para os montes; de onde virá o socorro? O socorro vem do Senhor, que fez os céus e a terra.' },
    { id: 'tiago-4-8', reference: 'Tiago 4:8', theme: 'Proximidade', text: 'Chegai-vos a Deus, e ele se chegará a vós; purificai-vos de toda a imundícia e conservai-vos diante dele de todo o coração.' },
    { id: 'joão-15-13', reference: 'João 15:13', theme: 'Amor', text: 'Ninguém tem maior amor do que aquele que dá a sua vida pelos seus amigos.' },
];

export const VERSE_THEMES = Array.from(new Set(FEATURED_VERSES.map((v) => v.theme))).sort((a, b) =>
    a.localeCompare(b)
);

export function formatVerse(verse: FeaturedVerse): string {
    return `${verse.reference} — ${verse.text}`;
}

export function searchVerses(query: string, limit = 8): FeaturedVerse[] {
    const q = query.trim().toLowerCase();
    if (!q) return FEATURED_VERSES.slice(0, limit);
    return FEATURED_VERSES.filter(
        (v) =>
            v.text.toLowerCase().includes(q) ||
            v.reference.toLowerCase().includes(q) ||
            v.theme.toLowerCase().includes(q)
    ).slice(0, limit);
}
