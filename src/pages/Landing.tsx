import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, MotionConfig, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ArrowDown, ArrowUpRight, BookOpen, Check, Menu, Pause, Play, Plus, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';
import FeatureShowcase from '../components/landing/FeatureShowcase';
import ScrollText from '../components/landing/ScrollText';
import { scrollLandingTo, useSmoothScroll } from '../components/landing/useSmoothScroll';
import './landing.css';

function Wordmark({ large = false }: { large?: boolean }) {
  return <span className={`landing-wordmark${large ? ' landing-wordmark--large' : ''}`}><img src={logo} alt="OneFlow" width="1024" height="1024" /></span>;
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

const questions = [
  { question: 'O que é o OneFlow?', answer: 'Um espaço para viver sua fé no dia a dia. Aqui você encontra a Bíblia, planos de leitura, conexões para discipulado e o OneFlow V1, nosso assistente de inteligência artificial, em uma experiência integrada.' },
  { question: 'Como começo minha jornada?', answer: 'Clique em “Começar minha jornada” e entre com sua conta Google ou Discord. Depois, escolha por onde começar: uma leitura bíblica, um plano ou uma conversa.' },
  { question: 'Posso usar no celular?', answer: 'Sim. O OneFlow se adapta ao celular, tablet e computador. Acesse pelo navegador para levar suas leituras e conexões com você.' },
  { question: 'Como a inteligência artificial pode ajudar?', answer: 'O OneFlow V1 é um apoio para explorar perguntas, refletir sobre passagens e organizar estudos. Confira as respostas na Bíblia e use seu discernimento: a IA pode cometer erros e não substitui a Palavra nem o acompanhamento da sua comunidade.' },
];

export default function Landing() {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [animationsPaused, setAnimationsPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(0);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll();
  const scrollProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const entryPath = user ? '/dashboard' : '/auth';
  const motionDisabled = Boolean(reducedMotion || animationsPaused);
  useSmoothScroll(!motionDisabled);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'OneFlow — Sua fé em movimento';
    document.documentElement.classList.add('oneflow-landing-page');
    document.body.classList.add('oneflow-landing-page');
    window.scrollTo(0, 0);
    return () => {
      document.title = previousTitle;
      document.documentElement.classList.remove('oneflow-landing-page');
      document.body.classList.remove('oneflow-landing-page');
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);

  const navigateSection = (id: string) => {
    setMenuOpen(false);
    const section = document.getElementById(id);
    if (!section) return;
    const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
    scrollLandingTo(section.getBoundingClientRect().top + window.scrollY - margin, { immediate: motionDisabled });
  };

  return (
    <MotionConfig reducedMotion={motionDisabled ? 'always' : 'user'}>
      <div className="landing" data-motion={motionDisabled ? 'paused' : 'active'}>
        <a href="#landing-main" className="landing-skip">Pular para o conteúdo</a>
        <motion.div className="landing-reading-progress" style={{ scaleX: motionDisabled ? scrollYProgress : scrollProgress }} aria-hidden="true" />
        <header className="landing-header">
          <a className="landing-brand" href="#inicio" aria-label="OneFlow — início" onClick={(event) => { event.preventDefault(); navigateSection('inicio'); }}><Wordmark /></a>
          <nav className="landing-desktop-nav" aria-label="Navegação principal">
            <a href="#experiencia" onClick={(event) => { event.preventDefault(); navigateSection('experiencia'); }}>A experiência</a>
            <a href="#proposito" onClick={(event) => { event.preventDefault(); navigateSection('proposito'); }}>Nosso propósito</a>
            <a href="#duvidas" onClick={(event) => { event.preventDefault(); navigateSection('duvidas'); }}>Dúvidas</a>
          </nav>
          <div className="landing-header-actions">
            <button className="landing-motion-toggle" onClick={() => setAnimationsPaused(!animationsPaused)} aria-label={animationsPaused ? 'Retomar animações' : 'Pausar animações'} aria-pressed={animationsPaused} title={animationsPaused ? 'Retomar animações' : 'Pausar animações'}>{animationsPaused ? <Play size={15} /> : <Pause size={15} />}</button>
            <Link to={entryPath} className="landing-header-entry">{user ? 'Meu espaço' : 'Entrar'}<ArrowUpRight size={16} /></Link>
            <button ref={menuButton} className="landing-menu-toggle" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="landing-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
          {menuOpen && <nav id="landing-mobile-menu" className="landing-mobile-menu" aria-label="Navegação para celular">
            <a href="#experiencia" onClick={(event) => { event.preventDefault(); navigateSection('experiencia'); }}>A experiência<ArrowUpRight size={18} /></a>
            <a href="#proposito" onClick={(event) => { event.preventDefault(); navigateSection('proposito'); }}>Nosso propósito<ArrowUpRight size={18} /></a>
            <a href="#duvidas" onClick={(event) => { event.preventDefault(); navigateSection('duvidas'); }}>Dúvidas<ArrowUpRight size={18} /></a>
          </nav>}
        </header>

        <main id="landing-main">
          <section id="inicio" className="landing-hero landing-container" aria-labelledby="hero-title">
            <div className="landing-hero-copy">
              <Reveal><p className="landing-eyebrow"><span className="landing-status-dot" /> UM ESPAÇO PARA A SUA FÉ</p></Reveal>
              <Reveal delay={0.1}><h1 id="hero-title"><ScrollText mode="letters" initialVisible>Sua fé.</ScrollText><br /><span>Em <em><ScrollText mode="letters" initialVisible>movimento.</ScrollText></em></span></h1></Reveal>
              <Reveal delay={0.2}><p className="landing-hero-description">A Palavra que inspira. As conexões que fortalecem.<br className="landing-desktop-break" /> Uma jornada com propósito, todos os dias.</p></Reveal>
              <Reveal className="landing-hero-actions" delay={0.3}>
                <Link to={entryPath} className="landing-button landing-button--light">{user ? 'Ir para meu espaço' : 'Começar minha jornada'}<span><ArrowUpRight size={20} /></span></Link>
                <a href="#experiencia" className="landing-text-link" onClick={(event) => { event.preventDefault(); navigateSection('experiencia'); }}>Conhecer o OneFlow<ArrowDown size={15} /></a>
              </Reveal>
              <Reveal delay={0.4}><div className="landing-hero-note"><span className="landing-note-line" /><p>Um só lugar. Muitas formas de crescer.</p></div></Reveal>
            </div>
            <div className="landing-hero-bottom"><span>PALAVRA. CONEXÃO. PROPÓSITO.</span><a href="#experiencia" onClick={(event) => { event.preventDefault(); navigateSection('experiencia'); }} aria-label="Explorar a experiência">CONTINUE A JORNADA<ArrowDown size={14} /></a><span className="landing-hero-index">01 — 04</span></div>
          </section>

          <div className="landing-marquee" aria-label="Leia. Conecte. Reflita. Cresça.">
            <div className="landing-marquee-track" aria-hidden="true">{[0, 1, 2, 3].map((iteration) => <div className="landing-marquee-group" key={iteration}><span>Leia.</span><Plus /><span className="landing-outline-text">Conecte.</span><Plus /><span>Reflita.</span><Plus /><span className="landing-outline-text">Cresça.</span><Plus /></div>)}</div>
          </div>

          <FeatureShowcase motionDisabled={motionDisabled} entryPath={entryPath} />

          <section id="proposito" className="landing-purpose landing-container" aria-labelledby="purpose-title">
            <Reveal className="landing-purpose-top"><p className="landing-eyebrow">02 / O QUE NOS MOVE</p><p className="landing-section-note">TECNOLOGIA A SERVIÇO<br />DE ALGO MAIOR.</p></Reveal>
            <div className="landing-purpose-layout">
              <Reveal><h2 id="purpose-title"><ScrollText mode="letters" disabled={motionDisabled} end={0.65}>Mais presença.</ScrollText><br /><em><ScrollText mode="letters" disabled={motionDisabled} end={0.65}>Mais propósito.</ScrollText></em></h2><p className="landing-purpose-description"><ScrollText disabled={motionDisabled} end={0.65}>A fé se vive nos pequenos passos. Na passagem que toca você. Na conversa que acolhe. No tempo que você escolhe dedicar ao que importa.</ScrollText></p><p className="landing-purpose-description"><ScrollText disabled={motionDisabled} end={0.65}>O OneFlow reúne esses momentos para você cultivar uma caminhada mais próxima da Palavra e de outras pessoas.</ScrollText></p><Link to={entryPath} className="landing-text-link">Encontre seu próximo passo<ArrowUpRight size={17} /></Link></Reveal>
              <Reveal className="landing-purpose-principles" delay={0.15}>
                {[{ Icon: BookOpen, number: '01', title: 'A Palavra no centro', text: 'Leia, explore e volte ao que dá sentido à sua caminhada.' }, { Icon: Users, number: '02', title: 'A gente cresce junto', text: 'Crie conexões e compartilhe a jornada com outras pessoas.' }, { Icon: Check, number: '03', title: 'No seu próprio ritmo', text: 'Um plano, uma reflexão, um novo começo. Um passo de cada vez.' }].map(({ Icon, number, title, text }) => <div className="landing-principle" key={number}><span className="landing-principle-number">{number}</span><div><Icon size={22} strokeWidth={1.25} /><h3><ScrollText disabled={motionDisabled} end={0.72}>{title}</ScrollText></h3><p><ScrollText disabled={motionDisabled} end={0.72}>{text}</ScrollText></p></div><ArrowUpRight size={19} className="landing-principle-arrow" /></div>)}
              </Reveal>
            </div>
            <Reveal><div className="landing-manifesto"><p><ScrollText mode="letters" disabled={motionDisabled} end={0.68}>A jornada é sua.</ScrollText><br /><em><ScrollText disabled={motionDisabled} end={0.68}>Você não precisa caminhar só.</ScrollText></em></p><span className="landing-manifesto-sign">ONEFLOW</span></div></Reveal>
          </section>

          <section id="duvidas" className="landing-faq landing-container" aria-labelledby="faq-title">
            <Reveal className="landing-faq-intro"><p className="landing-eyebrow">03 / ANTES DO PRIMEIRO PASSO</p><h2 id="faq-title"><ScrollText mode="letters" disabled={motionDisabled} end={0.7}>Vamos tirar</ScrollText><br /><ScrollText mode="letters" disabled={motionDisabled} end={0.7}>suas</ScrollText> <em><ScrollText mode="letters" disabled={motionDisabled} end={0.7}>dúvidas.</ScrollText></em></h2><p><ScrollText disabled={motionDisabled} end={0.72}>Um pouco mais sobre o seu novo espaço.</ScrollText></p><Link to="/ajuda" className="landing-text-link">Central de ajuda<ArrowUpRight size={16} /></Link></Reveal>
            <div className="landing-faq-list">{questions.map((item, index) => <Reveal key={item.question} delay={index * 0.04}><div className={`landing-faq-item${activeQuestion === index ? ' is-open' : ''}`}><h3><button aria-expanded={activeQuestion === index} aria-controls={`landing-answer-${index}`} id={`landing-question-${index}`} onClick={() => setActiveQuestion(activeQuestion === index ? null : index)}><ScrollText disabled={motionDisabled} end={0.8}>{item.question}</ScrollText><Plus size={20} /></button></h3><div id={`landing-answer-${index}`} role="region" aria-labelledby={`landing-question-${index}`} hidden={activeQuestion !== index}><p>{item.answer}</p></div></div></Reveal>)}</div>
          </section>

          <section className="landing-cta" aria-labelledby="cta-title">
            <div className="landing-cta-orbits" aria-hidden="true"><i /><i /><i /></div>
            <Reveal className="landing-container landing-cta-inner"><p className="landing-eyebrow"><Check size={14} /> SEU PRÓXIMO PASSO COMEÇA AQUI</p><h2 id="cta-title"><ScrollText mode="letters" disabled={motionDisabled} end={0.7}>Entre no</ScrollText> <em><ScrollText mode="letters" disabled={motionDisabled} end={0.7}>flow.</ScrollText></em></h2><p><ScrollText disabled={motionDisabled} end={0.78}>Abra espaço para o que transforma você.</ScrollText></p><Link to={entryPath} className="landing-button landing-button--light">{user ? 'Voltar ao meu espaço' : 'Começar minha jornada'}<span><ArrowUpRight size={20} /></span></Link><span className="landing-cta-caption">Sua fé. Sua jornada. OneFlow.</span></Reveal>
          </section>
        </main>

        <footer className="landing-footer landing-container"><div className="landing-footer-top"><Link to="/" aria-label="OneFlow — início"><Wordmark large /></Link><p>Conectados pela fé.<br />Em movimento pelo propósito.</p><a href="#inicio" className="landing-back-top" onClick={(event) => { event.preventDefault(); navigateSection('inicio'); }}>De volta ao início<ArrowUpRight size={17} /></a></div><div className="landing-footer-bottom"><span>© {new Date().getFullYear()} OneFlow</span><div><Link to="/terms">Termos de uso</Link><Link to="/privacy">Privacidade</Link><Link to="/ajuda">Ajuda</Link></div><span>FEITO PARA A SUA CAMINHADA.</span></div></footer>
      </div>
    </MotionConfig>
  );
}
