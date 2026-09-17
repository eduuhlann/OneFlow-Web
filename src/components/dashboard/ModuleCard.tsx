import { ArrowUpRight } from 'lucide-react';
import type { DashboardModule } from './modules';

interface ModuleCardProps {
  module: DashboardModule;
  onClick: () => void;
}

export function ModuleCard({ module, onClick }: ModuleCardProps) {
  const Icon = module.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${module.label}: ${module.description}`}
      className="group relative flex h-full w-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-left transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-[0.98] md:p-5"
    >
      {module.isPro && (
        <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white/70">
          Pro
        </span>
      )}

      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-white/85 transition-colors duration-200 group-hover:text-white">
        <Icon size={20} strokeWidth={1.75} />
      </span>

      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="font-serif text-[15px] font-semibold leading-tight text-white">{module.label}</h3>
        <p className="mt-1 font-sans text-[11px] leading-snug text-white/55">{module.description}</p>

        <span className="mt-auto inline-flex items-center gap-0.5 pt-3 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45 transition-colors duration-200 group-hover:text-white/70">
          Acessar
          <ArrowUpRight size={10} strokeWidth={2.5} />
        </span>
      </div>
    </button>
  );
}