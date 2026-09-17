import { useState } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import CustomizationModal from '../components/CustomizationModal';
import { Header } from '../components/dashboard/Header';
import { ModulesGrid } from '../components/dashboard/ModulesGrid';
import { MobileDock } from '../components/dashboard/MobileDock';
import { DockAvatar } from '../components/dashboard/DockAvatar';
import { FloatingDockDesktop } from '../components/ui/floating-dock';
import { NotificationBell } from '../components/NotificationBell';
import { CUSTOMIZE_MODULE_ID, DASHBOARD_MODULES } from '../components/dashboard/modules';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  const displayName =
    profile?.display_name ||
    profile?.username ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Usuário';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <PageTransition>
      <div className="min-h-screen text-white selection:bg-white selection:text-black">
        {/* Mobile layout */}
        <div className="mx-auto w-full max-w-md px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] md:hidden md:px-5">
          <Header profile={profile} user={user} />

          <section className="mt-7">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-white/45">
              Bem-vindo
            </p>
            <h1 className="mt-1.5 font-serif text-2xl font-bold leading-none tracking-tight text-white">
              {displayName}
            </h1>
          </section>

          <ModulesGrid onCustomize={() => setIsCustomizationOpen(true)} />
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block">
          <div className="mx-auto w-full max-w-6xl px-10 pt-12 lg:px-14">
            <header className="flex items-center justify-between gap-6">
              <div className="min-w-0 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">
                  Bem-vindo
                </span>
                <h1 className="truncate text-4xl font-bold tracking-tighter lg:text-5xl">
                  {displayName}
                </h1>
              </div>

              <FloatingDockDesktop
                className="mx-0 h-[72px] items-end gap-3 rounded-full bg-gray-50 px-4 pb-2 shadow-lg dark:bg-neutral-900"
                items={[
                  {
                    title: 'Notificações',
                    icon: <NotificationBell dockMode />,
                    href: '#',
                  },
                  {
                    title: 'Perfil',
                    icon: <DockAvatar profile={profile} user={user} />,
                    href: '/profile',
                    onClick: () => navigate('/profile'),
                    full: true,
                  },
                  {
                    title: 'Configurações',
                    icon: (
                      <Settings className="h-[85%] w-[85%] text-white/80 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110" />
                    ),
                    href: '/settings',
                    onClick: () => navigate('/settings'),
                  },
                  {
                    title: 'Sair',
                    icon: (
                      <LogOut className="h-[85%] w-[85%] text-red-500/80 transition-all duration-300 group-hover:-translate-x-1 group-hover:scale-110" />
                    ),
                    href: '#',
                    onClick: handleSignOut,
                  },
                ]}
              />
            </header>
          </div>
        </div>

        {/* Mobile floating dock */}
        <MobileDock onCustomize={() => setIsCustomizationOpen(true)} />

        {/* Desktop animated floating dock */}
        <div
          className="pointer-events-none fixed bottom-0 left-0 right-0 z-[100] hidden justify-center md:flex"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="pointer-events-auto">
            <FloatingDockDesktop
              className="border border-white/10 bg-neutral-900/70 shadow-2xl shadow-black/50 backdrop-blur-xl"
              items={DASHBOARD_MODULES.map((module) => ({
                title: module.label,
                icon: (
                  <module.icon className="h-full w-full text-neutral-500 dark:text-neutral-300" />
                ),
                href: module.path || '#',
                onClick:
                  module.id === CUSTOMIZE_MODULE_ID
                    ? () => setIsCustomizationOpen(true)
                    : module.path
                      ? () => navigate(module.path!)
                      : undefined,
              }))}
            />
          </div>
        </div>

        <CustomizationModal
          isOpen={isCustomizationOpen}
          onClose={() => setIsCustomizationOpen(false)}
        />
      </div>
    </PageTransition>
  );
}