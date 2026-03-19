import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { FloatingDock } from '../components/ui/floating-dock';
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
    BrainCircuit,
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
    TreePine,
    Map as MapIcon,
    Compass,
    Palette as PaletteIcon
} from 'lucide-react';
import {
    IconBook,
    IconMap,
    IconBrain,
    IconCalendar,
    IconClock,
    IconPalette
} from "@tabler/icons-react";
import CustomizationModal from '../components/CustomizationModal';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import ParticleBackground from '../components/ParticleBackground';
import PageTransition from '../components/PageTransition';
import { statsService } from '../services/features/statsService';
import { STATIC_BOOKS } from '../services/bible/staticBibleData';
import { usePreferences } from '../contexts/PreferencesContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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
                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-5 group-hover:bg-white/20 transition-all"
                        style={{ transform: "translateZ(30px)" }}
                    >
                        <item.icon size={20} className="text-white" />
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
        const container = constraintsRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
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

    const displayName = profile?.username || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

    const menuItems = useMemo(() => {
        const items = [
            { id: 'bible', icon: BookOpen, label: 'Bíblia', description: 'Continue sua leitura', path: '/bible' },
            { id: 'journey', icon: MapIcon, label: 'Jornada', description: 'Explore o caminho da fé', path: '/journey' },
            { id: 'olyviah', icon: BrainCircuit, label: 'Olyviah', description: 'IA Assistente Espiritual', path: '/olyviah' },
            { id: 'plans', icon: Calendar, label: 'Planos', description: 'Sua jornada de estudo', path: '/plans' },
            { id: 'prayer', icon: Clock, label: 'Oração', description: 'Temporizador de oração', path: '/prayer' },
            { id: 'customize', icon: PaletteIcon, label: 'Personalizar', description: 'Mude as cores e fundos', action: () => setIsCustomizationOpen(true) },
        ];

        if (preferences.menuOrder) {
            return [...items].sort((a, b) => {
                const indexA = preferences.menuOrder!.indexOf(a.id);
                const indexB = preferences.menuOrder!.indexOf(b.id);
                if (indexA === -1 || indexB === -1) return 0;
                return indexA - indexB;
            });
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

    const constraintsRef = useRef<HTMLDivElement>(null);

    // Calculate map state
    const mapNodes = useMemo(() => {
        const nodes = [];
        let theta = 0;
        let r = SPIRAL_A;

        // Filter books based on testament selection
        const filteredBooks = testamentFilter
            ? STATIC_BOOKS.filter(b => b.testament === testamentFilter)
            : STATIC_BOOKS;

        for (let i = 0; i < filteredBooks.length; i++) {
            const book = filteredBooks[i];

            const noiseX = Math.sin(i * 2.1) * 60;
            const noiseY = Math.cos(i * 1.7) * 60;

            const x = MAP_SIZE / 2 + r * Math.cos(theta) + noiseX;
            const y = MAP_SIZE / 2 + r * Math.sin(theta) + noiseY;

            const isCompleted = statsService.isBookCompleted(book.abbrev.pt);
            // ALL books are now unlocked
            const isUnlocked = true;

            nodes.push({
                ...book,
                index: i,
                x,
                y,
                isCompleted,
                isUnlocked,
                isCurrent: isUnlocked && !isCompleted
            });

            const dTheta = NODE_SPACING / r;
            theta += dTheta;
            r = SPIRAL_A + SPIRAL_B * theta;
        }
        return nodes;
    }, [stats, testamentFilter]);

    const currentBookNode = useMemo(() => {
        const abbrev = statsService.getLastReadBook();
        const node = mapNodes.find(n => n.abbrev.pt === abbrev);
        return node || mapNodes.find(n => n.isCurrent) || mapNodes[0];
    }, [mapNodes]);

    const initialX = useMemo(() => {
        if (!currentBookNode) return 0;
        const winWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth, 1280) : 1000;
        return (winWidth / 2) - currentBookNode.x;
    }, [currentBookNode?.x]);

    const initialY = useMemo(() => {
        if (!currentBookNode) return 0;
        return 300 - currentBookNode.y;
    }, [currentBookNode?.y]);

    const decorations = useMemo(() => {
        const rnd = LCG(12345);
        return Array.from({ length: 150 }).map((_, i) => {
            const x = rnd() * MAP_SIZE;
            const y = rnd() * MAP_SIZE;
            const type = rnd();
            const size = 16 + rnd() * 48;
            const opacity = 0.05 + rnd() * 0.15;
            let Icon = Mountain;
            if (type > 0.8) Icon = TreePine;
            else if (type > 0.6) Icon = Sparkles;
            else if (type > 0.4) Icon = Compass;

            const depth = rnd(); // 0 to 1
            let layer: 'far' | 'mid' | 'near' = 'mid';
            if (depth < 0.3) layer = 'far';
            else if (depth > 0.7) layer = 'near';

            return { id: i, x, y, size, opacity, Icon, layer };
        });
    }, []);

    // Motion values for parallax
    const mapX = useMotionValue(initialX);
    const mapY = useMotionValue(initialY);

    // Update map position when selection changes
    useEffect(() => {
        mapX.set(initialX);
        mapY.set(initialY);
    }, [initialX, initialY, mapX, mapY]);

    // Parallax transforms - adjusting the relative movement
    const farX = useTransform(mapX, (x) => (x - initialX) * -0.15);
    const farY = useTransform(mapY, (y) => (y - initialY) * -0.15);

    const nearX = useTransform(mapX, (x) => (x - initialX) * 0.15);
    const nearY = useTransform(mapY, (y) => (y - initialY) * 0.15);

    const farNodes = useMemo(() => decorations.filter(d => d.layer === 'far'), [decorations]);
    const midNodes = useMemo(() => decorations.filter(d => d.layer === 'mid'), [decorations]);
    const nearNodes = useMemo(() => decorations.filter(d => d.layer === 'near'), [decorations]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-black text-white p-4 md:p-12 overflow-x-hidden selection:bg-white selection:text-black relative">
                <ParticleBackground />
                <div className="max-w-full relative z-10">

                    {/* Header */}
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 md:mb-16">
                        <div className="flex items-center gap-3 md:gap-6">
                            <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
                                <img src={logo} alt="OneFlow" className="w-24 md:w-28 h-auto object-contain" />
                            </Link>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase">Bem-vindo</span>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                                    {displayName}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Profile Avatar */}
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={22} className="text-white/40" />
                                )}
                            </div>
                            <button
                                onClick={() => navigate('/settings')}
                                title="Configurações e Perfil"
                                className="p-3 md:p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
                            >
                                <Settings size={24} />
                            </button>
                            <button
                                onClick={handleSignOut}
                                title="Sair"
                                className="p-3 md:p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95 text-red-500/80 hover:text-red-400 shadow-lg shadow-black/20"
                            >
                                <LogOut size={24} />
                            </button>
                        </div>
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
                                        icon: <item.icon className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
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