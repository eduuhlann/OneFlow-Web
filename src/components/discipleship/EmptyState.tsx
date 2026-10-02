import React from 'react';
import { Compass, MessageSquare, type LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** Botão de ação principal: cápsula, borda fina, hover sutil. */
export const ActionButton: React.FC<{
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    tone?: 'strong' | 'subtle';
}> = ({ icon: Icon, label, onClick, tone = 'subtle' }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'group inline-flex h-[54px] items-center justify-center gap-2.5 rounded-[var(--of-radius-pill)] border px-7 text-[13px] font-medium tracking-tight transition-all duration-[var(--of-dur)] ease-[var(--of-ease)]',
            tone === 'strong'
                ? 'border-[var(--of-border-hover)] text-white hover:border-white/40 hover:bg-[var(--of-surface-hover)]'
                : 'border-[var(--of-border)] text-[var(--of-secondary)] hover:border-[var(--of-border-hover)] hover:bg-[var(--of-surface-hover)] hover:text-white'
        )}
    >
        <Icon
            size={15}
            strokeWidth={1.75}
            className="opacity-70 transition-opacity duration-[var(--of-dur)] group-hover:opacity-100"
        />
        {label}
    </button>
);

interface Props {
    onNewConversation: () => void;
    onExplorePlans: () => void;
}

/** Estado inicial da área de conversas. */
export const EmptyState: React.FC<Props> = ({ onNewConversation, onExplorePlans }) => (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
            <MessageSquare
                size={68}
                strokeWidth={1}
                className="mx-auto text-[var(--of-muted)]"
                aria-hidden="true"
            />

            <h1 className="mt-8 font-serif text-[2.75rem] font-normal leading-tight tracking-tight text-white sm:text-5xl">
                Escolha uma jornada
            </h1>

            <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-[var(--of-secondary)]">
                Inicie uma conversa ou explore os planos para aprofundar sua caminhada com Deus.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ActionButton
                    icon={MessageSquare}
                    label="Nova conversa"
                    onClick={onNewConversation}
                    tone="strong"
                />
                <ActionButton
                    icon={Compass}
                    label="Explorar planos"
                    onClick={onExplorePlans}
                />
            </div>
        </div>
    </div>
);

export default EmptyState;