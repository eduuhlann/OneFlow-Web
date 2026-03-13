import React, { useRef, useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const ParticleBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { preferences } = usePreferences();

    // Setup particles if that's the chosen wallpaper
    useEffect(() => {
        if (preferences.wallpaper !== 'particles') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Array<{ x: number, y: number, size: number, speedX: number, speedY: number, opacity: number }> = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticles = () => {
            particles = [];
            const count = Math.floor(window.innerWidth / 15);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 1.5 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: (Math.random() - 0.5) * 0.3,
                    opacity: Math.random() * 0.5 + 0.1
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Use current accent color or white for particles
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || 'white';
            ctx.fillStyle = 'white'; // Keeping them bright white looks best over dark backgrounds

            particles.forEach(p => {
                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        createParticles();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [preferences.wallpaper]);

    return (
        <div className={cn(
            "fixed inset-0 pointer-events-none z-0 transition-colors duration-1000",
            preferences.wallpaper === 'mesh' && "bg-wallpaper-mesh",
            preferences.wallpaper === 'aurora' && "bg-wallpaper-aurora",
            preferences.wallpaper === 'none' && "bg-wallpaper-none"
        )}>
            {preferences.wallpaper === 'particles' && (
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen" />
            )}
        </div>
    );
};

export default ParticleBackground;
