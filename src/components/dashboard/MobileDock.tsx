import { useLocation, useNavigate } from 'react-router-dom';
import { CUSTOMIZE_MODULE_ID, DASHBOARD_MODULES } from './modules';

interface MobileDockProps {
  onCustomize: () => void;
}

export function MobileDock({ onCustomize }: MobileDockProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-2xl border border-white/[0.08] bg-[#141414]/90 px-1.5 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        {DASHBOARD_MODULES.map((module) => {
          const Icon = module.icon;
          const active = Boolean(module.path) && (pathname === module.path || pathname.startsWith(`${module.path}/`));

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => {
                if (module.id === CUSTOMIZE_MODULE_ID) {
                  onCustomize();
                } else if (module.path) {
                  navigate(module.path);
                }
              }}
              aria-label={module.label}
              aria-current={active ? 'page' : undefined}
              className={`flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/45 hover:bg-white/[0.03] hover:text-white/80 active:scale-90'
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.2 : 1.75} />
            </button>
          );
        })}
      </nav>
    </div>
  );
}