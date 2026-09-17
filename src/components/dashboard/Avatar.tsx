import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  profile?: any;
  user?: any;
  size?: 'sm' | 'md';
}

export function Avatar({ profile, user, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const meta = user?.user_metadata || {};
  const url = profile?.avatar_url || meta.avatar_url || meta.picture || meta.avatar || meta.photoURL;

  useEffect(() => {
    setImgError(false);
  }, [url]);

  const sizeClass = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';

  return (
    <span
      className={`${sizeClass} inline-flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.05] ${
        !url || imgError ? 'text-white/40' : ''
      }`}
    >
      {url && !imgError ? (
        <img
          key={url}
          src={url}
          alt="Avatar do usuário"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <User size={size === 'sm' ? 16 : 18} strokeWidth={1.75} />
      )}
    </span>
  );
}