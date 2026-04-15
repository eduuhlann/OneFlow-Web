import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { FloatingDock, FloatingDockDesktop } from '../components/ui/floating-dock';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    BookOpen,
    Settings,
    LogOut,

    Calendar,
    Sparkles,
    ChevronRight,
    TrendingUp,
    Clock,
    CheckCircle2,
    Lock,
    User,
    Heart,
    Mountain,
    Compass,
    Palette as PaletteIcon,
    Image
} from 'lucide-react';
import CustomizationModal from '../components/CustomizationModal';
import { NotificationBell } from '../components/NotificationBell';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import ParticleBackground from '../components/ParticleBackground';
import PageTransition from '../components/PageTransition';
import { statsService } from '../services/features/statsService';
import { STATIC_BOOKS } from '../services/bible/staticBibleData';
import { usePreferences } from '../contexts/PreferencesContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// function cn(...inputs: ClassValue[]) {
//     return twMerge(clsx(inputs));
// }

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Wrapper for LordIcon. When a valid JSON src is provided, it renders the animated icon.
// Fallbacks to the default Lucide/Tabler icon if src is empty or placeholder.
const AnimatedIcon = ({ 
    fallback: FallbackIcon, 
    size = 24, 
    className 
}: { 
    src?: string, 
    fallback: React.ElementType, 
    size?: number,
    className?: string
}) => {
    return <FallbackIcon size={size} className={className} />;
};

const MAP_SIZE = 4000;
const NODE_SPACING = 300;
const SPIRAL_A = 120;
const SPIRAL_B = 40;

const LCG = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
};

const CloudLayer = ({ count = 20, seed = 42, speed = 0.05 }: { count?: number; seed?: number; speed?: number }) => {
    const rnd = LCG(seed);
    const clouds = useMemo(() => Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: rnd() * MAP_SIZE,
        y: rnd() * MAP_SIZE,
        size: 200 + rnd() * 400,
        opacity: 0.1 + rnd() * 0.2,
        duration: 20 + rnd() * 40,
    })), [count, rnd]);

    return (
        <div className="absolute inset-0 pointer-events-none z-[40]">
            {clouds.map(cloud => (
                <motion.div
                    key={cloud.id}
                    className="absolute bg-white/10 rounded-full blur-[60px]"
                    style={{
                        left: cloud.x,
                        top: cloud.y,
                        width: cloud.size,
                        height: cloud.size * 0.6,
                        opacity: cloud.opacity,
                    }}
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{
                        duration: cloud.duration,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};


function SortableCard({ id, item, navigate, glassStyle }: { id: string, item: any, navigate: any, glassStyle: 'crystal' | 'frosted' | 'solid' }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        perspective: "1000px",
    };

    const getGlassClasses = () => {
        if (isDragging) {
            return "bg-white/20 border-white/40 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.2)]";
        }
        
        switch (glassStyle) {
            case 'crystal':
                return "bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10";
            case 'solid':
                return "bg-black/60 backdrop-blur-3xl border-white/10 hover:bg-black/40";
            case 'frosted':
            default:
                return "bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20";
        }
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} 
            className="touch-none h-full relative cursor-grab active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                   if (!isDragging) {
                       item.action ? item.action() : navigate(item.path!);
                   } else {
                       e.preventDefault();
                   }
                }}
                className={cn(
                    "p-6 border rounded-3xl text-left group transition-all h-full shadow-2xl shadow-black/20",
                    getGlassClasses()
                )}
            >
                <div 
                    className="w-full h-full text-left pointer-events-none"
                    style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}
                >
                    <div 
                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-5 group-hover:bg-white/20 group-hover:-translate-y-2 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 relative"
                        style={{ transform: "translateZ(30px)" }}
                    >
                        <AnimatedIcon 
                            src={item.lordIconSrc} 
                            fallback={item.icon} 
                            size={20} 
                            className="text-white transition-all duration-300 group-hover:scale-[1.2]" 
                        />
                    </div>

                    <h3 
                        className="text-base font-bold mb-1 tracking-tight"
                        style={{ transform: "translateZ(40px)" }}
                    >
                        {item.label}
                    </h3>
                    <p 
                        className="text-white font-normal italic leading-relaxed text-[11px]"
                        style={{ transform: "translateZ(35px)" }}
                    >
                        {item.description}
                    </p>
                    <div 
                        className="mt-5 flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] text-white transition-colors uppercase"
                        style={{ transform: "translateZ(20px)" }}
                    >
                        {item.action ? 'Abrir' : 'Acessar'} <ChevronRight size={10} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

const DockAvatar = ({ profile, user }: { profile: any, user: any }) => {
    const [imgError, setImgError] = useState(false);
    const [decoError, setDecoError] = useState(false);
    
    // Expanded fallbacks: 1. Profile URL, 2. Google metadata keys (avatar_url, picture, avatar, photoURL)
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
                className="relative w-full h-full flex items-center justify-center rounded-full overflow-hidden"
                style={{ isolation: 'isolate', transform: 'translateZ(0)', WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
            >
                <img 
                    key={url}
                    src={url} 
                    alt="avatar" 
                    className="absolute inset-0 w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={() => setImgError(true)}
                />
                {profile?.discord_decoration_url && !decoError && (
                    <div className="absolute inset-[-18.5%] w-[137%] h-[137%] pointer-events-none z-20">
                        <img 
                            src={profile.discord_decoration_url} 
                            alt="Decoração" 
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                            onError={() => setDecoError(true)}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <User className="w-[85%] h-[85%] text-white/40 group-hover:text-white transition-colors" />
    );
};

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const { profile } = useProfile();
    const navigate = useNavigate();
    const { preferences, updatePreference } = usePreferences();
    const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
    const [stats, setStats] = useState(statsService.getStats());
    const [testamentFilter, setTestamentFilter] = useState<'VT' | 'NT' | null>(null);

    const lastBookAbbrev = useMemo(() => statsService.getLastReadBook() || 'gn', []);
    const selectedBook = useMemo(() =>
        STATIC_BOOKS.find(b => b.abbrev.pt === lastBookAbbrev) || STATIC_BOOKS[0],
        [lastBookAbbrev]);

    const [zoom, setZoom] = useState(1);
    const mapZoom = useMotionValue(1);

    // Zoom handling
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2));
            }
        };
        // const container = constraintsRef.current;
        // if (container) {
        //     container.addEventListener('wheel', handleWheel, { passive: false });
        // }
        // return () => {
        //     if (container) {
        //         container.removeEventListener('wheel', handleWheel);
        //     }
        // };
    }, []);

    useEffect(() => {
        mapZoom.set(zoom);
    }, [zoom, mapZoom]);

    useEffect(() => {
        setStats(statsService.getStats());
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    const displayName = profile?.display_name || profile?.username || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

    const menuItems = useMemo(() => {
        const items = [
            // Para adicionar os ícones animados:
            // 1. Acesse https://lordicon.com/icons/system/regular
            // 2. Escolha o ícone
            // 3. Clique em "Embed HTML" e copie a URL do src (ex: https://cdn.lordicon.com/wxnxiano.json)
            // 4. Cole no 'lordIconSrc' abaixo
            { id: 'bible', icon: BookOpen, lordIconSrc: '', label: 'Bíblia', description: 'Continue sua leitura', path: '/bible' },
            { id: 'discipleship', icon: User, lordIconSrc: '', label: 'Discipulado', description: 'Cresça acompanhado', path: '/discipleship' },

            { id: 'plans', icon: Calendar, lordIconSrc: '', label: 'Planos', description: 'Seus planos de estudo', path: '/plans' },
            { id: 'prayer', icon: Clock, lordIconSrc: '', label: 'Oração', description: 'Temporizador de oração', path: '/prayer' },
            { id: 'customize', icon: PaletteIcon, lordIconSrc: '', label: 'Personalizar', description: 'Mude as cores e fundos', action: () => setIsCustomizationOpen(true) },
        ];

        if (preferences.menuOrder) {
            const sortedItems = [...items].sort((a, b) => {
                const indexA = preferences.menuOrder!.indexOf(a.id);
                const indexB = preferences.menuOrder!.indexOf(b.id);
                if (indexA === -1 || indexB === -1) return 1; // Put new items at the end
                return indexA - indexB;
            });
            return sortedItems;
        }
        return items;
    }, [preferences.menuOrder]);

    const handleReorder = (newOrderIds: string[]) => {
        updatePreference('menuOrder', newOrderIds);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (active.id !== over?.id && over) {
            const oldIndex = menuItems.findIndex(i => i.id === active.id);
            const newIndex = menuItems.findIndex(i => i.id === over.id);
            
            const newOrderIds = arrayMove(menuItems, oldIndex, newIndex).map(i => i.id);
            handleReorder(newOrderIds);
        }
    };

    const mapX = useMotionValue(0);
    const mapY = useMotionValue(0);

    return (
        <PageTransition>
        <div className="min-h-screen bg-black/30 text-white p-4 md:p-12 overflow-x-hidden selection:bg-white selection:text-black relative">
            <div className="max-w-full relative z-10">

                    {/* Header */}
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 md:mb-16">
                        <div className="flex items-center gap-3 md:gap-6">

                            <div className="space-y-1">
                                <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase">Bem-vindo</span>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                                    {displayName}
                                </h1>
                            </div>
                        </div>

                        <FloatingDockDesktop
                            className="!flex mx-0 h-[72px] pb-2 px-4 bg-gray-50 dark:bg-neutral-900 rounded-full shadow-lg items-end gap-3 translate-y-2 md:translate-y-0"
                            items={[
                                {
                                    title: "Notificações",
                                    icon: <NotificationBell dockMode={true} />,
                                    href: "#",
                                },
                                {
                                    title: "Perfil",
                                    icon: <DockAvatar profile={profile} user={user} />,
                                    href: "/profile",
                                    full: true
                                },
                                {
                                    title: "Configurações",
                                    icon: <AnimatedIcon fallback={Settings} src="COLOQUE_O_LINK_AQUI_PARA_CONFIGURACOES.json" className="w-[85%] h-[85%] text-white/80 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110" />,
                                    href: "/settings"
                                },
                                {
                                    title: "Sair",
                                    icon: <LogOut className="w-[85%] h-[85%] text-red-500/80 transition-all duration-300 group-hover:-translate-x-1 group-hover:scale-110" />,
                                    href: "#",
                                    onClick: handleSignOut
                                }
                            ]}
                        />
                    </header>

                    {preferences.dashboardStyle === 'cards' ? (
                        <div className="space-y-8">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={menuItems.map(i => i.id)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12 relative">
                                        {menuItems.map((item) => (
                                            <SortableCard 
                                                key={item.id} 
                                                id={item.id} 
                                                item={item} 
                                                navigate={navigate} 
                                                glassStyle={preferences.glassStyle || 'frosted'} 
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    ) : (
                        <div className="fixed bottom-0 left-0 right-0 pb-8 flex justify-center z-[100] pointer-events-none">
                            <div className="pointer-events-auto">
                                <FloatingDock
                                    mobileClassName="translate-y-20"
                                    items={menuItems.map(item => ({
                                        title: item.label,
                                        icon: <AnimatedIcon src={item.lordIconSrc} fallback={item.icon} className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
                                        href: item.path || '#',
                                        onClick: item.action
                                    }))}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <CustomizationModal
                isOpen={isCustomizationOpen}
                onClose={() => setIsCustomizationOpen(false)}
            />
        </PageTransition>
    );
}