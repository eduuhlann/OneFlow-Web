import React from 'react';
import { Compass, MessageSquare, type LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type SidebarTab = 'chats' | 'explore';

const TABS: { id: SidebarTab; label: string; icon: LucideIcon }[] = [
    { id: 'chats', label: 'Conversas', icon: MessageSquare },
    { id: 'explore', label: 'Explorar', icon: Compass },
];

interface Props {
    value: SidebarTab;
    onChange: (tab: SidebarTab) => void;
}

/** Seletor em cápsula entre "Conversas" e "Explorar". */
export const NavigationTabs: React.FC<Props> = ({ value, onChange }) => (
    <nav className="mt-5 px-4" aria-label="Navegação de conversas">
        <div className="flex w-full max-w-[296px] items-center gap-1 rounded-[var(--of-radius-pill)] border border-[var(--of-border-pill)] bg-[var(--of-surface)] p-1">
            {TABS.map(tab => {
                const isActive = value === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={clsx(
                            'flex flex-1 items-center justify-center gap-2 rounded-[var(--of-radius-pill)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all duration-[var(--of-dur)] ease-[var(--of-ease)]',
                            isActive
                                ? 'bg-white text-black'
                                : 'text-[var(--of-secondary)] hover:bg-[var(--of-surface-hover)] hover:text-white'
                        )}
                    >
                        <tab.icon size={13} strokeWidth={1.75} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    </nav>
);

export default NavigationTabs;