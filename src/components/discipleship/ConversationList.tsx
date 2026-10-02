import React from 'react';
import { Loader2, MessageSquare, User, Users } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export interface FeedConversation {
    key: string;
    type: 'leader' | 'disciple' | 'group' | 'self';
    name: string;
    avatarUrl: string | null;
    profileId: string | null;
    preview: string;
    previewAt?: string;
    isPending: boolean;
    unread: number;
    /** Conexão original, repassada aos handlers da página. */
    source: any;
}

interface Props {
    items: FeedConversation[];
    selectedKey: string | null;
    loading: boolean;
    onSelect: (item: FeedConversation) => void;
    onOpenProfile: (userId: string) => void;
    onRespondInvite: (item: FeedConversation, accept: boolean) => void;
}

/** Rótulos internos de notas não devem aparecer como trecho da conversa. */
export function toPreviewText(raw?: string | null): string {
    const text = (raw || '').trim();
    if (!text) return '';
    if (text.startsWith('[CHALLENGE]:')) return 'Desafio de leitura';
    return text.replace('[SYSTEM]:', '').trim();
}

/** "agora", "12min", "3h", "2d" — no máximo 7 dias, depois a data curta. */
export function formatRelativeTime(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';

    const diff = Date.now() - then;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const Avatar = ({ item, onOpenProfile }: { item: FeedConversation; onOpenProfile: Props['onOpenProfile'] }) => {
    const body = item.avatarUrl ? (
        <img src={item.avatarUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
    ) : item.type === 'group' ? (
        <Users size={15} strokeWidth={1.75} className="text-[var(--of-muted)]" />
    ) : (
        <User size={15} strokeWidth={1.75} className="text-[var(--of-muted)]" />
    );

    const shell = (
        <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--of-border)] bg-[var(--of-surface)] transition-colors duration-[var(--of-dur)] group-hover/row:border-[var(--of-border-hover)]">
            {body}
        </span>
    );

    if (!item.profileId) return shell;

    return (
        <button
            type="button"
            onClick={e => { e.stopPropagation(); onOpenProfile(item.profileId!); }}
            title={`Ver perfil de ${item.name}`}
            aria-label={`Ver perfil de ${item.name}`}
            className="shrink-0 rounded-full transition-opacity duration-[var(--of-dur)] hover:opacity-80"
        >
            {shell}
        </button>
    );
};

const Invites = ({ item, onRespondInvite }: { item: FeedConversation; onRespondInvite: Props['onRespondInvite'] }) => (
    <div className="mt-1.5 flex items-center gap-2">
        <button
            type="button"
            onClick={e => { e.stopPropagation(); onRespondInvite(item, true); }}
            className="rounded-full bg-white px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-black transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:bg-[var(--of-primary)] active:scale-95"
        >
            Aceitar
        </button>
        <button
            type="button"
            onClick={e => { e.stopPropagation(); onRespondInvite(item, false); }}
            className="rounded-full border border-[var(--of-border)] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--of-secondary)] transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:border-[var(--of-border-hover)] hover:bg-[var(--of-surface-hover)] hover:text-white active:scale-95"
        >
            Recusar
        </button>
    </div>
);

const ConversationRow = ({
    item,
    isSelected,
    onSelect,
    onOpenProfile,
    onRespondInvite,
}: {
    item: FeedConversation;
    isSelected: boolean;
} & Pick<Props, 'onSelect' | 'onOpenProfile' | 'onRespondInvite'>) => {
    const { type, name, preview, previewAt, isPending, unread } = item;
    const time = formatRelativeTime(previewAt);

    return (
        <button
            type="button"
            onClick={() => !isPending && onSelect(item)}
            disabled={isPending}
            aria-current={isSelected ? 'true' : undefined}
            className={cn(
                'group/row flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all duration-[var(--of-dur)] ease-[var(--of-ease)]',
                isPending && 'cursor-default',
                isSelected
                    ? 'bg-[var(--of-surface)]'
                    : 'hover:bg-[var(--of-surface-hover)]'
            )}
        >
            <Avatar item={item} onOpenProfile={onOpenProfile} />

            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    <span className={cn(
                        'truncate text-[13px] tracking-tight',
                        isSelected ? 'font-medium text-white' : 'text-white/85'
                    )}>
                        {name}
                    </span>
                    {type !== 'self' && (
                        <span className="shrink-0 rounded-full border border-[var(--of-border)] px-1.5 py-px text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--of-muted)]">
                            {type === 'leader' ? 'Líder' : type === 'group' ? 'Grupo' : 'Discípulo'}
                        </span>
                    )}
                    {time && (
                        <span className="ml-auto shrink-0 text-[10px] tabular-nums text-[var(--of-muted)]">
                            {time}
                        </span>
                    )}
                </span>

                {isPending ? (
                    <Invites item={item} onRespondInvite={onRespondInvite} />
                ) : (
                    <span className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-[12px] leading-relaxed text-[var(--of-muted)]">
                            {preview || (type === 'self' ? 'Suas mensagens salvas' : 'Conversa em branco')}
                        </span>
                        {unread > 0 && (
                            <span className="ml-auto flex size-[18px] shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-black">
                                {unread}
                            </span>
                        )}
                    </span>
                )}
            </span>
        </button>
    );
};

/**
 * Lista de conversas em formato de feed: mais recente primeiro, com trecho da
 * última mensagem e horário. Sem cards, sem embodyamentos — apenas linhas.
 */
export const ConversationList: React.FC<Props> = ({
    items,
    selectedKey,
    loading,
    onSelect,
    onOpenProfile,
    onRespondInvite,
}) => {
    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 size={15} className="animate-spin text-[var(--of-muted)]" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
                <MessageSquare size={18} strokeWidth={1.5} className="text-[var(--of-muted)]" />
                <p className="text-[11px] leading-relaxed text-[var(--of-muted)]">
                    Nenhuma conversa por aqui ainda.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-0.5">
            {items.map(item => (
                <ConversationRow
                    key={item.key}
                    item={item}
                    isSelected={selectedKey === item.key}
                    onSelect={onSelect}
                    onOpenProfile={onOpenProfile}
                    onRespondInvite={onRespondInvite}
                />
            ))}
        </div>
    );
};

export default ConversationList;