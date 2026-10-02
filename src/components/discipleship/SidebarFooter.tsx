import React from 'react';
import logo from '../../assets/logo.png';

/**
 * Assinatura discreta do OneFlow no rodapé da sidebar.
 * A logo é forçada para monocromática (branco sobre preto) via filtro CSS,
 * preservando a transparência original do arquivo.
 */
export const SidebarFooter: React.FC = () => (
    <footer className="flex items-center gap-2.5 border-t border-[var(--of-border)] px-5 py-4">
        <img
            src={logo}
            alt="OneFlow"
            className="size-4 shrink-0 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
        />
        <span className="truncate text-[9px] font-semibold uppercase tracking-[0.28em] text-[var(--of-muted)]">
            A Bíblia, do seu jeito
        </span>
    </footer>
);

export default SidebarFooter;