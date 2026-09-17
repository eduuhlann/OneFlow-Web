import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import PageTransition from '../components/PageTransition';
import CustomizationModal from '../components/CustomizationModal';
import { Header } from '../components/dashboard/Header';
import { ModulesGrid } from '../components/dashboard/ModulesGrid';
import { MobileDock } from '../components/dashboard/MobileDock';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  const displayName =
    profile?.display_name ||
    profile?.username ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Usuário';

  return (
    <PageTransition>
      <div className="min-h-screen text-white selection:bg-white selection:text-black">
        <div className="mx-auto w-full max-w-md px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] md:px-5">
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

        <MobileDock onCustomize={() => setIsCustomizationOpen(true)} />

        <CustomizationModal
          isOpen={isCustomizationOpen}
          onClose={() => setIsCustomizationOpen(false)}
        />
      </div>
    </PageTransition>
  );
}