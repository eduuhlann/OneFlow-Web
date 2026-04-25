import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';
import ParticleBackground from '../components/ParticleBackground';

export default function Home() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Scroll parallax effects
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 300]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);



    return (
        <div ref={containerRef} className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-serif selection:bg-white selection:text-black relative">
            
            <ParticleBackground forceParticles={true} />



            {/* Grain Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-40 mix-blend-overlay bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] bg-repeat" />

            <header className="relative z-30 flex items-center justify-between p-8 md:p-12 max-w-7xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="flex items-center gap-3"
                >
                    <img src={logo} alt="OneFlow Logo" className="w-8 h-8 object-contain grayscale invert opacity-90" />
                    <span className="font-serif text-xl tracking-[0.2em] uppercase">OneFlow</span>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.1 }}
                >
                    <Link 
                        to="/auth" 
                        className="text-sm tracking-[0.1em] uppercase hover:opacity-50 transition-opacity border-b border-white/20 pb-1"
                    >
                        Acessar
                    </Link>
                </motion.div>
            </header>

            <main className="relative z-20">
                <motion.section 
                    style={{ y: heroY, opacity: opacityHero }}
                    className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto"
                >
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2, delay: 0.5 }}
                        className="text-white/40 tracking-[0.2em] uppercase text-xs md:text-sm mb-8 font-sans font-medium"
                    >
                        Um projeto pessoal e independente
                    </motion.p>

                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl md:text-7xl lg:text-[6.5rem] font-normal tracking-tight leading-[1.05] mb-12"
                    >
                        Feito para ajudar. <br/>
                        <span className="italic text-white/60">Sem fins lucrativos.</span>
                    </motion.h1>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="max-w-2xl mx-auto"
                    >
                        <p className="text-lg md:text-xl text-white/60 leading-relaxed font-light mb-16 font-sans">
                            O OneFlow nasceu de uma necessidade minha: eu queria um lugar simples e livre de distrações para ler a Bíblia, fazer meus devocionais e organizar meu tempo com Deus. Decidi criar isso sozinho e compartilhar de graça com quem também precisa.
                        </p>

                        <Link 
                            to="/auth" 
                            className="inline-flex items-center gap-4 text-sm tracking-[0.2em] uppercase group font-sans"
                        >
                            <span className="border-b border-white pb-1 group-hover:text-white/70 group-hover:border-white/70 transition-colors">
                                Acessar Plataforma
                            </span>
                            <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-500" />
                        </Link>
                    </motion.div>
                </motion.section>

                <section className="py-32 px-6 max-w-6xl mx-auto border-t border-white/10 relative z-30 bg-[#050505]">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 1 }}
                        >
                            <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tight mb-8 leading-snug">
                                Menos ruído. <br/>
                                <span className="italic text-white/50">Mais foco.</span>
                            </h2>
                            <p className="text-white/60 leading-relaxed font-light text-lg mb-6 font-sans">
                                Sabe quando você abre o celular para ler a Bíblia e acaba se distraindo com notificações ou anúncios? O objetivo aqui é exatamente o oposto. Desenvolvi o OneFlow para ser um ambiente limpo.
                            </p>
                            <p className="text-white/60 leading-relaxed font-light text-lg font-sans">
                                Não tem uma grande empresa por trás, não tem investidor e não tem ninguém tentando lucrar com os seus dados. Sou apenas um desenvolvedor criando uma ferramenta útil para a nossa jornada cristã.
                            </p>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5 }}
                            className="relative aspect-square border border-white/10 p-8 md:p-12 flex flex-col justify-between group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-1000 ease-[0.16,1,0.3,1]" />
                            
                            <h3 className="text-3xl italic text-white/70 relative z-10">O que tem aqui?</h3>
                            
                            <ul className="space-y-8 relative z-10">
                                {['Leitura Bíblica Limpa', 'Diário e Devocional Pessoal', 'Organização de Discipulado', 'Registro de Orações e Notas'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-6 group-hover:translate-x-2 transition-transform duration-700" style={{ transitionDelay: `${i * 100}ms` }}>
                                        <span className="text-xs text-white/30 font-mono mt-1.5 pt-0.5">0{i + 1}</span>
                                        <span className="text-xl text-white/90 tracking-wide font-serif">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </section>

                <section className="py-40 text-center px-6 relative z-30 bg-[#050505]">
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2 }}
                    >
                        <h2 className="text-4xl md:text-6xl lg:text-6xl tracking-tight mb-8">
                            Sinta-se em <span className="italic text-white/50">casa.</span>
                        </h2>
                        <p className="text-lg text-white/50 mb-16 max-w-xl mx-auto font-sans font-light">
                            Tudo aqui foi programado do zero, linha por linha, com muito carinho. Espero que o OneFlow te ajude tanto quanto tem me ajudado.
                        </p>
                        <Link 
                            to="/auth" 
                            className="inline-block border border-white px-14 py-6 tracking-[0.2em] uppercase text-xs font-sans font-bold hover:bg-white hover:text-black transition-colors duration-500"
                        >
                            Criar Conta Gratuita
                        </Link>
                    </motion.div>
                </section>
            </main>

            <footer className="border-t border-white/10 py-16 px-6 relative z-30 bg-[#050505]">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-10">
                    <div className="flex flex-col gap-4">
                        <img src={logo} alt="Logo" className="w-8 h-8 object-contain grayscale invert opacity-50 mx-auto" />
                        <p className="text-white/50 text-sm font-sans font-light leading-relaxed max-w-md mx-auto">
                            Feito com dedicação por apenas uma pessoa. <br/> Um projeto totalmente sem fins lucrativos criado para abençoar a sua vida.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between w-full border-t border-white/5 pt-8 text-xs text-white/30 tracking-widest uppercase font-sans">
                        <p>© {new Date().getFullYear()} OneFlow Project.</p>
                        <div className="flex gap-8 mt-4 md:mt-0">
                            <Link to="/privacy" className="hover:text-white transition-colors">Privacidade</Link>
                            <Link to="/terms" className="hover:text-white transition-colors">Termos</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
