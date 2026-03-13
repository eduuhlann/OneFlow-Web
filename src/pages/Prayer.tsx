import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft,
    Play,
    Pause,
    RotateCcw,
    Volume2,
    VolumeX,
    CloudRain,
    Trees,
    Music,
    Wind
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import PageTransition from '../components/PageTransition';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Ambience = 'none' | 'rain' | 'nature' | 'worship' | 'wind';

const Prayer: React.FC = () => {
    const navigate = useNavigate();

    // Timer State
    const [timeLeft, setTimeLeft] = useState(15 * 60); // Default 15 mins
    const [isActive, setIsActive] = useState(false);
    const [initialTime, setInitialTime] = useState(15 * 60);

    // Ambience State
    const [ambience, setAmbience] = useState<Ambience>('none');
    const [isMuted, setIsMuted] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Play completion sound logic here
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(initialTime);
    };

    const ambienceOptions = [
        { id: 'rain', icon: CloudRain, label: 'Chuva' },
        { id: 'nature', icon: Trees, label: 'Natureza' },
        { id: 'wind', icon: Wind, label: 'Vento' },
        { id: 'worship', icon: Music, label: 'Worship' },
    ];

    return (
        <PageTransition>
        <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-white selection:text-black">
            {/* Background Ambience Layer */}
            <div className="fixed inset-0 pointer-events-none">
                <AnimatePresence mode="wait">
                    {ambience !== 'none' && (
                        <motion.div
                            key="ambience"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.05 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/10"
                        />
                    )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_100%)]" />
            </div>

            {/* Header */}
            <header className="relative z-10">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                    <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-xs tracking-widest uppercase">Voltar</span>
                </button>
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full px-6 flex items-center justify-center relative z-10">
                {/* Timer Section */}
                <div className="flex flex-col items-center justify-center text-center">
                    <motion.div
                        animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="relative mb-12"
                    >
                        <div className="text-[12rem] md:text-[16rem] font-black tracking-tighter italic leading-none tabular-nums select-none opacity-10 blur-xl absolute inset-0 text-white">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-[10rem] md:text-[13rem] font-black tracking-tighter italic leading-none tabular-nums select-none relative">
                            {formatTime(timeLeft)}
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-6 mb-16">
                        <button
                            onClick={resetTimer}
                            className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all active:scale-90"
                        >
                            <RotateCcw className="w-8 h-8" />
                        </button>
                        <button
                            onClick={toggleTimer}
                            className="w-24 h-24 bg-white text-black rounded-[2rem] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-white/20"
                        >
                            {isActive ? <Pause className="w-10 h-10 fill-black" /> : <Play className="w-10 h-10 fill-black ml-1" />}
                        </button>
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all active:scale-90"
                        >
                            {isMuted ? <VolumeX className="w-8 h-8 text-red-400" /> : <Volume2 className="w-8 h-8" />}
                        </button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        {ambienceOptions.map(option => (
                            <button
                                key={option.id}
                                onClick={() => setAmbience(ambience === option.id ? 'none' : option.id as Ambience)}
                                className={cn(
                                    "px-6 py-4 rounded-2xl flex items-center gap-3 transition-all border font-bold text-xs tracking-widest uppercase",
                                    ambience === option.id
                                        ? "bg-white text-black border-white"
                                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20"
                                )}
                            >
                                <option.icon size={18} />
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            {/* Quote Footer */}
            <footer className="p-12 text-center relative z-10">
                <p className="text-white/20 font-serif italic text-lg select-none">
                    "Onde dois ou três estiverem reunidos em meu nome, ali eu estarei com eles."
                </p>
            </footer>
        </div>
        </PageTransition>
    );
};

export default Prayer;
