import { Link2, Check } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProfileLinkBarProps {
    url: string;
    copied: boolean;
    onCopy: () => void;
}

/**
 * Barra inferior com o link público do perfil e o
 * botão "COPIAR LINK" com feedback controlado pelo pai.
 */
export function ProfileLinkBar({ url, copied, onCopy }: ProfileLinkBarProps) {
    return (
        <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
                <Link2 size={14} className="shrink-0 text-white/" aria-hidden="true" />
                <span
                    className="min-w-0 truncate text-xs text-white/"
                    title={url}
                >
                    {url}
                </span>
            </div>

            <button
                type="button"
                onClick={onCopy}
                aria-label={copied ? 'Link copiado' : 'Copiar link do perfil'}
                aria-live="polite"
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-transparent px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/ transition-colors duration-150 hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0b] ${
                    copied ? 'border-white/30 text-white' : ''
                }`}
            >
                {copied ? <Check size={13} /> : <Link2 size={13} />}
                {copied ? 'COPIADO' : 'COPIAR LINK'}
            </button>
        </div>
    );
}
