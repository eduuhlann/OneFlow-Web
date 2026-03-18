// src/constants/decorations.ts

export interface DecorationOption {
    id: string;
    name: string;
    url: string;
    author?: string;
}

export const COMMUNITY_DECORATIONS: DecorationOption[] = [
    {
        id: 'eduardo-special',
        name: 'Brilho de Verão',
        url: 'https://cdn.discordapp.com/avatar-decoration-presets/v2_a_624192b47596d66e5f15a6b0932afbd3.png?size=240',
        author: 'Eduardo'
    },
    {
        id: 'fire-essence',
        name: 'Essência de Fogo',
        url: 'https://cdn.discordapp.com/avatar-decoration-presets/a_b67ad73e5f76f7902d5158a183d2f932.png?size=240',
        author: 'OneFlow'
    },
    {
        id: 'cyber-neon',
        name: 'Cyber Neon',
        url: 'https://cdn.discordapp.com/avatar-decoration-presets/a_86c8a32a0c4f30cd251261a868f0e572.png?size=240',
        author: 'OneFlow'
    }
];
