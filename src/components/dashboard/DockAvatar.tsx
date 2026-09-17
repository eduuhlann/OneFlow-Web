import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface DockAvatarProps {
  profile?: any;
  user?: any;
}

export function DockAvatar({ profile, user }: DockAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [decoError, setDecoError] = useState(false);

  const meta = user?.user_metadata || {};
  const url = profile?.avatar_url || meta.avatar_url || meta.picture || meta.avatar || meta.photoURL;

  useEffect(() => {
    setImgError(false);
  }, [url]);

  useEffect(() => {
    setDecoError(false);
  }, [profile?.discord_decoration_url]);

  if (url && !imgError) {
    return (
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full"
        style={{
          isolation: 'isolate',
          transform: 'translateZ(0)',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        }}
      >
        <img
          key={url}
          src={url}
          alt="avatar"
          className="absolute inset-0 h-full w-full rounded-full object-cover"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
        />
        {profile?.discord_decoration_url && !decoError && (
          <div className="pointer-events-none absolute inset-[-18.5%] z-20 h-[137%] w-[137%]">
            <img
              src={profile.discord_decoration_url}
              alt="Decoração"
              className="h-full w-full object-contain"
              crossOrigin="anonymous"
              onError={() => setDecoError(true)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <User className="h-[85%] w-[85%] text-white/40 transition-colors group-hover:text-white" />
  );
}