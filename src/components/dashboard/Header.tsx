import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';

interface HeaderProps {
  profile?: any;
  user?: any;
}

export function Header({ profile, user }: HeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between">
      <Link
        to="/dashboard"
        aria-label="OneFlow — início"
        className="font-serif text-[22px] font-bold tracking-tight text-white transition-opacity duration-200 hover:opacity-80 focus-visible:opacity-80 focus-visible:outline-none"
      >
        OneFlow
      </Link>

      <Link
        to="/profile"
        aria-label="Meu perfil"
        className="rounded-full transition-all duration-200 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        <Avatar profile={profile} user={user} />
      </Link>
    </header>
  );
}