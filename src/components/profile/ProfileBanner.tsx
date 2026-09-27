interface ProfileBannerProps {
    bannerSrc: string | null;
    featuredVerse?: string | null;
    avatarSrc: string | null;
    displayName?: string | null;
}

/**
 * Banner cinematográfico com versículo fixado no canto superior
 * e avatar circular sobreposto à base do banner.
 */
export function ProfileBanner({ bannerSrc, featuredVerse, avatarSrc, displayName }: ProfileBannerProps) {
    const initial = (displayName || '?').charAt(0).toUpperCase();

    return (
        <div className="relative h-48 w-full sm:h-60 md:h-72 lg:h-80">
            <div className="absolute inset-0 overflow-hidden rounded-t-[2rem]">
                {bannerSrc ? (
                    <img
                        src={bannerSrc}
                        alt=""
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                    />
                ) : (
                    <div className="h-full w-full bg-[#161616]" />
                )}

                <div className="absolute inset-0 bg-[#2c2620]/10 mix-blend-overlay" aria-hidden="true" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                    }}
                    aria-hidden="true"
                />

                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/50 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/80 to-transparent" aria-hidden="true" />
            </div>

            {featuredVerse ? (
                <blockquote className="absolute right-6 top-6 z-10 max-w-[46%] truncate text-right font-serif text-[13px] font-medium leading-snug text-white sm:top-8 sm:text-[15px]">
                    &ldquo;{featuredVerse}&rdquo;
                </blockquote>
            ) : null}

            <div
                className="absolute bottom-0 left-6 z-20 sm:left-8"
                style={{ transform: 'translateY(60%)' }}
            >
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[#0b0b0b] shadow-[0_6px_28px_-4px_rgba(0,0,0,0.7)] ring-1 ring-white/20 sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                    {avatarSrc ? (
                        <img
                            src={avatarSrc}
                            alt=""
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a]">
                            <span className="font-serif text-4xl font-bold text-white lg:text-5xl">{initial}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
