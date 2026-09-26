const OFFICIAL_SITE = 'https://oneflowweb.vercel.app';

const isLocal = (hostname: string) => hostname === 'localhost' || hostname === '127.0.0.1';

/**
 * Link público do OneFlow.
 * Em produção aponta para o site oficial; em desenvolvimento mantém o host local
 * para o preview do perfil abrir na mesma origem do app.
 */
export const siteOrigin = (): string => {
    if (typeof window === 'undefined') return OFFICIAL_SITE;
    return isLocal(window.location.hostname) ? window.location.origin : OFFICIAL_SITE;
};

export const profileUrl = (username?: string | null): string =>
    `${siteOrigin()}/u/${username || 'usuario'}`;
