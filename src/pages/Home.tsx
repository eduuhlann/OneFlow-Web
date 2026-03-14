import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Heart,
  Moon,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  User,
  Pencil,
  LogOut
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import AuthForm from '../components/AuthForm';
import ProfileEditModal from '../components/ProfileEditModal';
import logo from '../assets/logo.png';
import ParticleBackground from '../components/ParticleBackground';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



const Navbar = ({ onOpenAuth, onOpenEditProfile }: { onOpenAuth: () => void; onOpenEditProfile: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4",
      isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10 py-3" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <img src={logo} alt="OneFlow" className="w-32 md:w-36 h-auto object-contain" />
        </motion.div>

        <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
          
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {/* Profile Avatar */}
                <button
                  onClick={onOpenEditProfile}
                  className="relative group"
                  title="Editar Perfil"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center transition-all group-hover:ring-2 group-hover:ring-white/30">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-white/60" />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil size={9} className="text-black" />
                  </div>
                </button>
                <span className="text-white/60 text-[10px] font-bold tracking-widest max-w-[80px] truncate">{profile?.username || user.email?.split('@')[0]}</span>
                <button
                  onClick={signOut}
                  title="Sair"
                  className="text-white/20 hover:text-white transition-colors ml-1"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button onClick={onOpenAuth} className="hover:text-white transition-colors text-white/40">Entrar / Cadastrar</button>
            )}

            <button
              onClick={() => user ? navigate('/dashboard') : onOpenAuth()}
              className="px-6 py-2.5 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/5 font-bold"
            >
              Abrir App
            </button>
          </div>
        </div>

        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-white/10 p-8 flex flex-col gap-8 md:hidden overflow-hidden"
          >
            {user ? (
              <div className="flex items-center gap-3 text-white/80 border-b border-white/10 pb-6 mb-2">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={22} className="text-white/60" />
                  )}
                </div>
                <div>
                   <span className="block text-sm font-bold">{profile?.username || 'Usuário'}</span>
                   <span className="block text-xs opacity-50 text-white/40">{user?.email}</span>
                </div>
                <button onClick={() => { onOpenEditProfile(); setMobileMenuOpen(false); }} className="ml-auto text-white/30 hover:text-white">
                  <Pencil size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }} className="text-2xl font-serif italic text-white/60 hover:text-white transition-colors text-left border-b border-white/10 pb-6 mb-2">
                Entrar / Cadastrar
              </button>
            )}

            <a href="#manifesto" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-serif italic text-white/60 hover:text-white transition-colors">O que é</a>
            <button
              onClick={() => { user ? navigate('/dashboard') : onOpenAuth(); setMobileMenuOpen(false); }}
              className="w-full py-5 bg-white text-black rounded-2xl font-bold text-lg mt-4"
            >
              Abrir App
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};


const Hero = ({ onOpenAuth }: { onOpenAuth: () => void }) => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden pt-20">
      <motion.div
        style={{ y: y1, opacity, scale }}
        className="relative z-10 text-center max-w-5xl flex flex-col items-center"
      >
        <h1 className="font-serif text-7xl md:text-[11rem] font-bold leading-[0.85] tracking-tighter mb-12">
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="block"
          >
            Um Só
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="block italic font-normal text-white/30"
          >
            Fluxo.
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="text-xl md:text-2xl text-white/40 max-w-2xl mx-auto mb-16 font-light leading-relaxed"
        >
          OneFlow redefine a leitura bíblica. Uma interface que respira, um design que silencia o mundo e amplifica a voz que importa.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24"
        >
          <button
            onClick={() => user ? navigate('/dashboard') : onOpenAuth()}
            className="group relative px-10 py-5 bg-white text-black rounded-full font-bold flex items-center gap-3 hover:scale-105 active:scale-95 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {user ? 'Ir para o App' : 'Começar Jornada'}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>


      </motion.div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-10 w-32 h-32 border border-white/5 rounded-3xl rotate-12 backdrop-blur-sm"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-10 w-48 h-48 border border-white/5 rounded-full -rotate-12 backdrop-blur-sm"
        />
      </div>
    </section>
  );
};


const ExperienceManifesto = () => {
  const coreValues = [
    { title: "Fluidez", description: "Onde cada transição é um suspiro. Uma navegação sem atrito, desenhada para desaparecer e deixar apenas o essencial no seu fluxo de leitura." },
    { title: "Sutileza", description: "A beleza mora no que não grita. Tons profundos, tipografia curada e um equilíbrio visual que acalma os sentidos e eleva o espírito." },
    { title: "Foco", description: "Em um mundo ruidoso, silenciamos o desnecessário. O OneFlow é o seu lugar de concentração absoluta para o estudo da Palavra." },
    { title: "Privacidade", description: "Seu momento de fé é sagrado. Sem rastros, sem pixels intrusivos, sem nuvens de dados. Apenas você e o que realmente importa." }
  ];

  return (
    <section id="manifesto" className="py-40 px-6 relative overflow-hidden bg-white/[0.01]">
      <div className="max-w-7xl mx-auto border-t border-white/5 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-32"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20 mb-8 block font-sans">A Filosofia do Essencial</span>
          <h2 className="text-6xl md:text-[8rem] font-serif font-bold leading-[0.85] tracking-tighter mb-12">
            Design que <br />
            <span className="italic font-normal text-white/30">encontra o espírito.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-32 gap-y-24">
          {coreValues.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index, duration: 0.8 }}
              className="group"
            >
              <div className="flex items-baseline gap-8 mb-8">
                <span className="text-white/5 font-serif italic text-5xl group-hover:text-white/20 transition-all duration-700">0{index + 1}</span>
                <h3 className="text-4xl font-serif font-bold tracking-tight">{value.title}</h3>
              </div>
              <p className="text-white/40 leading-relaxed font-light text-xl max-w-sm group-hover:text-white/60 transition-all duration-700">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/[0.01] to-transparent pointer-events-none" />
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-32 px-6 border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <img src={logo} alt="OneFlow" className="w-32 md:w-48 h-auto object-contain" />
            </div>
            <p className="text-white/30 text-lg font-light max-w-sm leading-relaxed">
              Acreditamos que a tecnologia deve servir ao espírito, não distraí-lo. OneFlow é o nosso manifesto por uma fé mais focada.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/20 mb-8">Navegação</h4>
            <ul className="space-y-4 text-white/50 font-light">
              <li><a href="#" className="hover:text-white transition-colors">App Web</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/20 mb-8">Legal</h4>
            <ul className="space-y-4 text-white/50 font-light">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacidade</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Termos</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center pt-12 border-t border-white/5">
          <p className="text-white/20 text-xs tracking-widest uppercase">© 2026 OneFlow Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    if (user && isAuthModalOpen) {
      setIsAuthModalOpen(false);
    }
  }, [user, isAuthModalOpen]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <ParticleBackground />
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} onOpenEditProfile={() => setIsEditProfileOpen(true)} />
      <main className="relative z-10">
        <Hero onOpenAuth={() => setIsAuthModalOpen(true)} />
        <ExperienceManifesto />
      </main>
      <Footer />

      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
             <motion.div
               initial={{ scale: 0.95, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.95, y: 20 }}
               className="relative w-full max-w-md"
             >
               <button onClick={() => setIsAuthModalOpen(false)} className="absolute -top-12 right-0 text-white/50 hover:text-white">
                 <X size={24} />
               </button>
               <AuthForm onSuccess={() => setIsAuthModalOpen(false)} />
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditProfileOpen && (
          <ProfileEditModal onClose={() => setIsEditProfileOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}