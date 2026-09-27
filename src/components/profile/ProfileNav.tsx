import { ArrowLeft } from 'lucide-react';

interface ProfileNavProps {
    onBack: () => void;
    onApp: () => void;
    appLabel?: string;
}

/**
 * Barra de navegação do perfil público: VOLTAR à esquerda,
 * marca serifada ao centro e atalho do app à direita.
 */
export function ProfileNav({ onBack, onApp, appLabel = 'App' }: ProfileNavProps) {
    return (
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080808]/85 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 transition-colors duration-150 hover:border-white/25 hover:bg-white/[0.03] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
                >
                    <ArrowLeft size={13} strokeWidth={1.75} aria-hidden="true" />
                    Voltar
                </button>

                <span className="font-serif text-[19px] leading-none tracking-[0.01em] text-white sm:text-[21px]">
                    OneFlow
                </span>

                <button
                    type="button"
                    onClick={onApp}
                    className="rounded-full border border-white bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
                >
                    {appLabel}
                </button>
            </div>
        </header>
    );
}
