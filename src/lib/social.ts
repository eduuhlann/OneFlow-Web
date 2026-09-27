/** helpers sociais compartilhados entre perfil, chat e notificações */

export const isSelfView = (viewerId: string | null | undefined, targetId: string | null | undefined): boolean =>
    !!viewerId && !!targetId && viewerId === targetId;

/** Primeiro nome para labels curtos ("Ana está digitando...") */
export function firstName(name: string | null | undefined, fallback = 'Alguém'): string {
    const clean = (name || '').trim();
    if (!clean) return fallback;
    return clean.split(/\s+/)[0];
}

export function shortBioOf(shortBio?: string | null, bio?: string | null, max = 60): string {
    const source = (shortBio || '').trim() || (bio || '').trim();
    if (!source) return '';
    if (source.length <= max) return source;
    return `${source.slice(0, max - 1).trimEnd()}…`;
}
