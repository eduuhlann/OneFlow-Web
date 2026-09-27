export const MENTION_REGEX = /@([a-zA-Z0-9_.]{2,30})/g;

export interface MentionSegment {
    type: 'text' | 'mention';
    value: string;
}

/**
 * Divide o conteúdo da mensagem em pedaços de texto e menções,
 * para renderizar cada @username destacado e clicável.
 */
export function splitMentions(content: string): MentionSegment[] {
    if (!content) return [];
    const segments: MentionSegment[] = [];
    let lastIndex = 0;

    MENTION_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = MENTION_REGEX.exec(content)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
        }
        segments.push({ type: 'mention', value: match[1] });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        segments.push({ type: 'text', value: content.slice(lastIndex) });
    }

    return segments;
}

export function extractMentionedUsernames(content: string): string[] {
    const found: string[] = [];
    MENTION_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = MENTION_REGEX.exec(content || '')) !== null) {
        found.push(match[1]);
    }
    return Array.from(new Set(found));
}

export interface MentionQuery {
    query: string;
    start: number;
}

/**
 * Detecta se o cursor está sobre um token @em digitação.
 * Devolve a query e a posição do "@" para posicionar o dropdown.
 */
export function getActiveMentionQuery(text: string, caret: number): MentionQuery | null {
    if (caret === undefined || caret < 0) return null;
    const upToCaret = text.slice(0, caret);
    const atIndex = upToCaret.lastIndexOf('@');
    if (atIndex === -1) return null;

    const query = upToCaret.slice(atIndex + 1);
    if (/\s/.test(query)) return null;
    if (query.length > 30) return null;
    // Não é menção se o @ estiver no meio de uma palavra (e-mail, por exemplo)
    if (atIndex > 0 && /[\w.]/.test(text[atIndex - 1])) return null;

    return { query, start: atIndex };
}

export function applyMention(
    text: string,
    mention: MentionQuery,
    username: string
): { text: string; caret: number } {
    const before = text.slice(0, mention.start);
    const after = text.slice(mention.start + 1 + mention.query.length);
    const inserted = `@${username} `;
    return {
        text: `${before}${inserted}${after}`,
        caret: before.length + inserted.length,
    };
}
