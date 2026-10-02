import React from 'react';
import { ArrowLeft, MessageSquarePlus, Plus, Users, type LucideIcon } from 'lucide-react';

interface Props {
    onBack: () => void;
    onNewConversation: () => void;
    onNewGroup: () => void;
    onNewJourney: () => void;
}

const GhostButton = ({
    icon: Icon,
    label,
    onClick,
}: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className="flex size-10 items-center justify-center rounded-full border border-[var(--of-border)] bg-[var(--of-surface)] text-[var(--of-secondary)] transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:border-[var(--of-border-hover)] hover:bg-[var(--of-surface-hover)] hover:text-white"
    >
        <Icon size={16} strokeWidth={1.75} />
    </button>
);

/**
 * Cabeçalho da sidebar: voltar + nova conversa + comunidade/grupo + nova jornada.
 * O botão "+" é o único elemento preenchido em branco.
 */
export const SidebarHeader: React.FC<Props> = ({ onBack, onNewConversation, onNewGroup, onNewJourney }) => (
    <header className="flex items-center justify-between gap-2 px-4 pt-4">
        <button
            type="button"
            onClick={onBack}
            title="Voltar"
            aria-label="Voltar"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--of-border)] bg-[var(--of-surface)] text-[var(--of-secondary)] transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:border-[var(--of-border-hover)] hover:bg-[var(--of-surface-hover)] hover:text-white"
        >
            <ArrowLeft size={16} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2">
            <GhostButton icon={MessageSquarePlus} label="Nova conversa" onClick={onNewConversation} />
            <GhostButton icon={Users} label="Novo grupo" onClick={onNewGroup} />
            <button
                type="button"
                onClick={onNewJourney}
                title="Nova jornada"
                aria-label="Nova jornada"
                className="flex size-10 items-center justify-center rounded-full border border-transparent bg-white text-black transition-all duration-[var(--of-dur)] ease-[var(--of-ease)] hover:bg-[var(--of-primary)] active:scale-95"
            >
                <Plus size={17} strokeWidth={2} />
            </button>
        </div>
    </header>
);

export default SidebarHeader;