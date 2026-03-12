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
    Wind,
    Plus,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

    // Prayer Requests
    const [requests, setRequests] = useState<string[]>([]);
    const [newRequest, setNewRequest] = useState('');

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

    const handleAddRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRequest.trim()) return;
        setRequests(prev => [...prev, newRequest.trim()]);
        setNewRequest('');
    };

    const removeRequest = (index: number) => {
        setRequests(prev => prev.filter((_, i) => i !== index));
    };

    const ambienceOptions = [
        { id: 'rain', icon: CloudRain, label: 'Chuva' },
        { id: 'nature', icon: Trees, label: 'Natureza' },
        { id: 'wind', icon: Wind, label: 'Vento' },
        { id: 'worship', icon: Music, label: 'Worship' },
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
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
            <header className="p-6 md:p-12 relative z-10">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                    <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-xs tracking-widest uppercase">Voltar</span>
                </button>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
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

                {/* Prayer Requests Section */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col h-[600px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-white/5">
                        <Plus size={100} />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black italic tracking-tighter mb-2">Pedidos de Oração</h2>
                            <p className="text-white/30 text-xs font-bold tracking-widest uppercase italic">Mantenha seu foco no que importa</p>
                        </div>

                        <form onSubmit={handleAddRequest} className="relative mb-8">
                            <input
                                type="text"
                                placeholder="Pelo que você quer orar?"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
                                value={newRequest}
                                onChange={(e) => setNewRequest(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-white text-black rounded-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </form>

                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                            <AnimatePresence>
                                {requests.map((request, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-white/20" />
                                            <span className="font-medium text-white/70">{request}</span>
                                        </div>
                                        <button
                                            onClick={() => removeRequest(i)}
                                            className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {requests.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 pointer-events-none">
                                    <CheckCircle2 size={48} className="mb-4" />
                                    <p className="font-bold text-xs tracking-[0.2em] uppercase">Sua lista está vazia</p>
                                </div>
                            )}
                        </div>
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
    );
};

export default Prayer;
