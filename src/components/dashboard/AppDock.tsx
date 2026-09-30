/**
 * Dock de navegação do dashboard ("Navegação do App" em Personalizar →
 * Estilo de Navegação), no mesmo estilo do MobileDock e do ProfileNav:
 * pílula escura translúcida, itens com ícone e rótulo em caixa alta, e
 * destaque na categoria ativa.
 */
import { useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface AppDockItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Rota usada só para marcar o item ativo. */
  path?: string;
  onClick?: () => void;
}

export function AppDock({ items }: { items: AppDockItem[] }) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Atalhos do dashboard"
      className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#141414]/90 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl lg:gap-2"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = Boolean(item.path) && (pathname === item.path || pathname.startsWith(`${item.path}/`));

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className={`group flex items-center gap-2.5 rounded-xl px-4 py-3 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 lg:gap-3 lg:px-5 ${
              active ? 'bg-white/10 text-white' : 'text-white/ hover:bg-white/[0.03] hover:text-white/80'
            }`}
          >
            <Icon
              className="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-110 lg:h-7 lg:w-7"
              strokeWidth={active ? 2.2 : 1.75}
              aria-hidden="true"
            />
            <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] lg:text-[11px]">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
