/**
 * Fundo "Grid Distorcido": grade branca sobre o preto que cede ao redor
 * do cursor. Cada vértice é empurrado para fora por uma força que cai com
 * a distância do mouse e volta sozinho para a posição original quando o
 * ponteiro sai da janela.
 *
 * O canvas fica atrás de todo o conteúdo (o wrapper em ParticleBackground
 * é pointer-events-none), por isso a posição do mouse é lida na window.
 */
import { useEffect, useRef } from 'react';

const SPACING = 46;        // distância entre linhas da grade, em px
const RADIUS = 420;        // alcance da distorção, em px
const PUSH = 50;           // deslocamento máximo de um vértice, em px
const EASE = 0.14;         // velocidade de ida e volta dos vértices
const LINE_ALPHA = 0.15;

export const GridBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        interface Vertex { x: number; y: number; ox: number; oy: number }

        let width = 0;
        let height = 0;
        let cols = 0;
        let rows = 0;
        let points: Vertex[] = [];
        let frame = 0;

        // Infinity = ponteiro fora da janela, ou seja, força zero em tudo.
        const pointer = { x: Infinity, y: Infinity };

        const build = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Duas colunas/linhas de margem: sem elas a distorção
            // revelaria a borda do canvas quando o mouse encosta nela.
            cols = Math.ceil(width / SPACING) + 4;
            rows = Math.ceil(height / SPACING) + 4;
            points = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const ox = (c - 2) * SPACING;
                    const oy = (r - 2) * SPACING;
                    points.push({ x: ox, y: oy, ox, oy });
                }
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            for (const p of points) {
                let tx = 0;
                let ty = 0;

                const dx = p.ox - pointer.x;
                const dy = p.oy - pointer.y;
                const dist = Math.hypot(dx, dy);
                if (dist < RADIUS && dist > 0.001) {
                    // Suaviza a queda: o máximo empurra, a borda mal encosta.
                    const push = (1 - dist / RADIUS) ** 2 * PUSH;
                    tx = (dx / dist) * push;
                    ty = (dy / dist) * push;
                }

                p.x += (p.ox + tx - p.x) * EASE;
                p.y += (p.oy + ty - p.y) * EASE;
            }

            ctx.strokeStyle = `rgba(255, 255, 255, ${LINE_ALPHA})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const i = r * cols + c;
                    const p = points[i];
                    if (c < cols - 1) {
                        const right = points[i + 1];
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(right.x, right.y);
                    }
                    if (r < rows - 1) {
                        const below = points[i + cols];
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(below.x, below.y);
                    }
                }
            }
            ctx.stroke();

            frame = requestAnimationFrame(draw);
        };

        const onPointerMove = (e: PointerEvent) => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
        };
        const releasePointer = () => {
            pointer.x = Infinity;
            pointer.y = Infinity;
        };

        window.addEventListener('resize', build);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('blur', releasePointer);
        document.documentElement.addEventListener('mouseleave', releasePointer);

        build();
        draw();

        return () => {
            window.removeEventListener('resize', build);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('blur', releasePointer);
            document.documentElement.removeEventListener('mouseleave', releasePointer);
            cancelAnimationFrame(frame);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
};
