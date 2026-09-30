import { BookOpen, Calendar, Clock, Palette, User, type LucideIcon } from 'lucide-react';
import type { DashboardStyle } from '../../contexts/PreferencesContext';

export interface DashboardModule {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  path?: string;
}

export const CUSTOMIZE_MODULE_ID = 'customize';

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: 'bible',
    label: 'Bíblia',
    description: 'Leia e explore a Bíblia',
    icon: BookOpen,
    path: '/bible',
  },
  {
    id: 'discipleship',
    label: 'Discipulado',
    description: 'Cresça no conhecimento',
    icon: User,
    path: '/discipleship',
  },
  {
    id: 'plans',
    label: 'Planos',
    description: 'Siga planos de leitura',
    icon: Calendar,
    path: '/plans',
  },
  {
    id: 'prayer',
    label: 'Oração',
    description: 'Tenha um momento de oração',
    icon: Clock,
    path: '/prayer',
  },
  {
    id: CUSTOMIZE_MODULE_ID,
    label: 'Personalizar',
    description: 'Mude sua experiência de leitura',
    icon: Palette,
  },
];

/**
 * Docks disponíveis no rodapé do dashboard. O usuário escolhe um deles
 * em Personalizar → Estilo do App → Estilo de Navegação.
 */
export const DOCK_STYLES: { id: DashboardStyle; label: string }[] = [
  { id: 'floating', label: 'Dock Flutuante' },
  { id: 'nav', label: 'Navegação do App' },
];