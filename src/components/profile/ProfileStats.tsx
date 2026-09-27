import { Users, UserCheck, BookOpen, Compass } from 'lucide-react';

interface StatCardProps {
    icon: React.ReactNode;
    value: number;
    label: string;
}

/**
 * Card de estatística: ícone linear, número grande e legenda
 * em letras maiúsculas com espaçamento amplo.
 */
export function StatCard({ icon, value, label }: StatCardProps) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0e0e0e] px-5 py-6 text-center">
            <span className="flex items-center justify-center rounded-full bg-white/[0.04] p-2 text-white/">
                {icon}
            </span>
            <span className="text-[28px] font-sans font-semibold tracking-tight text-white tabular-nums">
                {value}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/">
                {label}
            </span>
        </div>
    );
}

export const STAT_ICONS = {
    followers: <Users size={16} strokeWidth={1.5} />,
    following: <UserCheck size={16} strokeWidth={1.5} />,
    chapters: <BookOpen size={16} strokeWidth={1.5} />,
    groups: <Compass size={16} strokeWidth={1.5} />,
};
