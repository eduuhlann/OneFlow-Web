import { BookOpen, Calendar, Clock, Crown, Palette, User, type LucideIcon } from 'lucide-react';

export interface DashboardModule {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  path?: string;
  isPro?: boolean;
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
  {
    id: 'pro',
    label: 'OneFlow Pro',
    description: 'Recursos exclusivos',
    icon: Crown,
    path: '/pro',
    isPro: true,
  },
];