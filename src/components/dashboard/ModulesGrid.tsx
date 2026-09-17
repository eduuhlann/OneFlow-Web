import { useNavigate } from 'react-router-dom';
import { CUSTOMIZE_MODULE_ID, DASHBOARD_MODULES } from './modules';
import { ModuleCard } from './ModuleCard';

interface ModulesGridProps {
  onCustomize: () => void;
}

export function ModulesGrid({ onCustomize }: ModulesGridProps) {
  const navigate = useNavigate();

  return (
    <section aria-labelledby="modules-heading" className="mt-8">
      <h2
        id="modules-heading"
        className="font-serif text-lg font-semibold tracking-tight text-white"
      >
        Módulos principais
      </h2>

      <div className="mt-4 grid grid-cols-2 auto-rows-fr gap-3 md:gap-4">
        {DASHBOARD_MODULES.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            onClick={() => {
              if (module.id === CUSTOMIZE_MODULE_ID) {
                onCustomize();
              } else if (module.path) {
                navigate(module.path);
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}