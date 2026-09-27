import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ProfileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
    // CTA principal: fundo branco, texto preto
    primary: 'bg-white text-black border border-white hover:bg-white/90',
    // Secundário: fundo quase preto, borda fina
    secondary: 'bg-white/[0.02] text-white/70 border border-white/12 hover:border-white/30 hover:text-white hover:bg-white/[0.05]',
    ghost: 'bg-transparent text-white/ border border-white/12 hover:border-white/30 hover:text-white',
};

const BASE =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 ' +
    'text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap ' +
    'transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out ' +
    'hover:shadow-[0_6px_20px_-10px_rgba(255,255,255,0.35)] active:scale-[0.98] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0b] ' +
    'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none disabled:active:scale-100';

export function ProfileButton({ variant = 'secondary', className = '', children, ...rest }: ProfileButtonProps) {
    return (
        <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
            {children}
        </button>
    );
}
