import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, MessageCircle, Sparkles, Users } from 'lucide-react';
import ScrollText from './ScrollText';
import { scrollLandingTo } from './useSmoothScroll';

const STICKY_TOP = 90;
const HORIZONTAL_TRAVEL_RATIO = 0.6;

const features = [
  { id: 'palavra', number: '01', tag: 'BÍBLIA', title: 'Uma pausa.\nUma nova perspectiva.', description: 'Encontre tempo para a Palavra. Explore livros, capítulos e passagens em uma leitura feita para você se aprofundar.', Icon: BookOpen },
  { id: 'constancia', number: '02', tag: 'PLANOS DE LEITURA', title: 'Pequenos passos.\nRaízes profundas.', description: 'Transforme intenção em constância. Encontre planos de leitura e construa sua caminhada um dia de cada vez.', Icon: CalendarDays },
  { id: 'conexao', number: '03', tag: 'DISCIPULADO', title: 'Caminhar junto\nfaz toda a diferença.', description: 'Conecte-se com outras pessoas, compartilhe reflexões e fortaleça a fé em conversas com propósito.', Icon: Users },
  { id: 'reflexao', number: '04', tag: 'ONEFLOW V1', title: 'Boas perguntas.\nNovas descobertas.', description: 'Conte com um assistente de IA para explorar suas perguntas, aprofundar reflexões e encontrar um ponto de partida para estudar.', Icon: Sparkles },
];

function BiblePreview() {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const passages = [
    { label: 'Salmos 23', reference: 'SALMOS 23:1–3', text: 'O Senhor é o meu pastor; de nada terei falta.', caption: 'Ele renova as minhas forças e me guia por caminhos de justiça.' },
    { label: 'João 15', reference: 'JOÃO 15:5', text: 'Eu sou a videira; vocês são os ramos.', caption: 'Uma leitura sobre permanecer, crescer e dar frutos.' },
    { label: 'Filipenses 4', reference: 'FILIPENSES 4:13', text: 'Tudo posso naquele que me fortalece.', caption: 'Uma leitura sobre encontrar força e contentamento em Cristo.' },
  ];
  const selectWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % passages.length;
    else if (event.key === 'ArrowLeft') next = (index + passages.length - 1) % passages.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = passages.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    tabRefs.current[next]?.focus();
  };
  return <div className="landing-preview landing-bible-preview"><div className="landing-preview-top"><span><BookOpen size={15} />Sua pausa com a Palavra</span><span>NVI</span></div><div className="landing-bible-tabs" role="tablist" aria-label="Passagens da prévia">{passages.map((passage, index) => <button ref={(element) => { tabRefs.current[index] = element; }} role="tab" tabIndex={selected === index ? 0 : -1} aria-selected={selected === index} aria-controls="landing-passage" id={`landing-passage-tab-${index}`} key={passage.label} onClick={() => setSelected(index)} onKeyDown={(event) => selectWithKeyboard(event, index)}>{passage.label}</button>)}</div><div className="landing-passage" id="landing-passage" role="tabpanel" aria-labelledby={`landing-passage-tab-${selected}`} tabIndex={0}><span className="landing-preview-label">{passages[selected].reference}</span><p key={selected}>{passages[selected].text}</p><span>{passages[selected].caption}</span></div><div className="landing-bible-preview-footer"><span className="landing-preview-label">LEIA. RESPIRE. REFLITA.</span><BookOpen size={18} strokeWidth={1.2} /></div></div>;
}

function PlanPreview() {
  const [days, setDays] = useState([true, true, false, false, false]);
  const completed = days.filter(Boolean).length;
  return <div className="landing-preview landing-plan-preview"><div className="landing-preview-top"><span><CalendarDays size={15} />Um dia de cada vez</span><span>PRÉVIA</span></div><div className="landing-plan-heading"><div className="landing-plan-mark" aria-hidden="true"><span /><span /><span /></div><span className="landing-preview-label">SUA CAMINHADA</span><h4>Crie raízes<br /><em>na Palavra.</em></h4><p>5 momentos para desacelerar e refletir.</p></div><div className="landing-plan-days" aria-label="Experimente marcar os dias de leitura">{days.map((done, index) => <button aria-label={`${done ? 'Desmarcar' : 'Concluir'} dia ${index + 1}`} aria-pressed={done} key={index} onClick={() => setDays((current) => current.map((day, dayIndex) => dayIndex === index ? !day : day))}><span>{done ? <Check size={17} /> : String(index + 1).padStart(2, '0')}</span><small>DIA {index + 1}</small></button>)}</div><div className="landing-plan-progress"><span style={{ width: `${completed * 20}%` }} /></div><p className="landing-plan-caption" aria-live="polite">{completed} de 5 dias · Experimente marcar seu progresso</p></div>;
}

function ConnectionPreview() {
  const [selected, setSelected] = useState(0);
  const messages = ['Uma passagem me acompanhou hoje. Posso compartilhar com você?', 'O que você tem aprendido na sua caminhada esta semana?'];
  return <div className="landing-preview landing-connection-preview"><div className="landing-preview-top"><span><Users size={15} />Conexões com propósito</span><span>PRÉVIA</span></div><div className="landing-connection-orbit" aria-hidden="true"><i /><i /><span className="landing-avatar landing-avatar--one">V</span><span className="landing-connection-center"><Users size={30} strokeWidth={1} /></span><span className="landing-avatar landing-avatar--two">C</span><span className="landing-connection-star">✳</span></div><div className="landing-chat-bubble"><MessageCircle size={15} /><p>{messages[selected]}</p></div><button className="landing-preview-action" onClick={() => setSelected((selected + 1) % messages.length)}>Uma conversa pode ser o começo<ArrowRight size={16} /></button></div>;
}

function AiPreview() {
  const [selected, setSelected] = useState(0);
  const examples = [{ question: 'Por onde começar a ler a Bíblia?', answer: 'O Evangelho de João pode ser um bom começo para conhecer a vida e os ensinamentos de Jesus. Que tal separar um momento do seu dia para ler o primeiro capítulo?', reference: 'Um ponto de partida: João 1' }, { question: 'Como criar uma rotina de leitura?', answer: 'Comece com um tempo que cabe no seu dia. Escolha um livro, leia uma pequena passagem e anote o que chamou sua atenção. Constância se constrói com pequenos passos.', reference: 'Uma reflexão: Salmos 1:2–3' }];
  return <div className="landing-preview landing-ai-preview"><div className="landing-preview-top"><span><Sparkles size={15} />OneFlow V1</span><span>PRÉVIA</span></div><div className="landing-ai-symbol" aria-hidden="true">✳</div><div className="landing-ai-question"><span>VOCÊ</span><p>{examples[selected].question}</p></div><div className="landing-ai-answer"><span><Sparkles size={13} />ONEFLOW V1</span><p>{examples[selected].answer}</p><small><BookOpen size={12} />{examples[selected].reference}</small></div><button className="landing-ai-prompt" onClick={() => setSelected((selected + 1) % examples.length)}><span>Explorar outra pergunta</span><ArrowRight size={17} /></button></div>;
}

const previews = [BiblePreview, PlanPreview, ConnectionPreview, AiPreview];

export default function FeatureShowcase({ motionDisabled, entryPath }: { motionDisabled: boolean; entryPath: string }) {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ pinned: false, distance: 0, height: 650, travel: 0 });
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: [`start ${STICKY_TOP}px`, `end ${layout.height + STICKY_TOP}px`] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -layout.distance]);

  useEffect(() => {
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!stage || !viewport || !track) return;
    const measure = () => {
      const pinned = window.innerWidth >= 1000 && window.innerHeight >= 760 && !prefersReducedMotion;
      const leftPadding = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
      const distance = Math.max(0, track.scrollWidth - viewport.clientWidth + leftPadding);
      const height = stage.getBoundingClientRect().height;
      const travel = distance * HORIZONTAL_TRAVEL_RATIO;
      setLayout((current) => current.pinned === pinned && current.distance === distance && current.height === height && current.travel === travel
        ? current : { pinned, distance, height, travel });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage, { box: 'border-box' });
    observer.observe(viewport);
    observer.observe(track);
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [prefersReducedMotion]);

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const firstCard = trackRef.current?.children[0] as HTMLElement | undefined;
    if (layout.pinned && firstCard) setActive(Math.min(features.length - 1, Math.round(progress * layout.distance / (firstCard.offsetWidth + 24))));
  });

  useEffect(() => {
    if (layout.pinned) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => {
      const card = trackRef.current?.children[0] as HTMLElement | undefined;
      const gap = parseFloat(getComputedStyle(trackRef.current!).gap) || 0;
      if (card) setActive(Math.min(features.length - 1, Math.round(viewport.scrollLeft / (card.offsetWidth + gap))));
    };
    viewport.addEventListener('scroll', update, { passive: true });
    update();
    return () => viewport.removeEventListener('scroll', update);
  }, [layout.pinned]);

  const goTo = (index: number, instant = false) => {
    const nextIndex = Math.max(0, Math.min(features.length - 1, index));
    const card = trackRef.current?.children[nextIndex] as HTMLElement | undefined;
    if (!card) return;
    if (layout.pinned && sectionRef.current) {
      const top = sectionRef.current.getBoundingClientRect().top + window.scrollY;
      const progress = layout.distance ? Math.min(card.offsetLeft / layout.distance, 1) : 0;
      scrollLandingTo(top - STICKY_TOP + layout.travel * progress, { immediate: motionDisabled || instant });
    } else {
      viewportRef.current?.scrollTo({ left: card.offsetLeft, behavior: motionDisabled || instant ? 'instant' : 'smooth' });
    }
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); goTo(active + (event.key === 'ArrowRight' ? 1 : -1), true); }
  };

  const revealFocusedCard = (index: number, event: FocusEvent<HTMLElement>) => {
    if (!layout.pinned || !viewportRef.current) return;
    const target = event.target.getBoundingClientRect();
    const viewport = viewportRef.current.getBoundingClientRect();
    if (target.left < viewport.left + 16 || target.right > viewport.right - 16
      || target.top < STICKY_TOP || target.bottom > window.innerHeight) goTo(index, true);
  };

  return <section id="experiencia" ref={sectionRef} className={`landing-showcase${layout.pinned ? ' is-pinned' : ''}`} style={layout.pinned ? { height: layout.travel + layout.height } : undefined} aria-labelledby="experience-title">
    <div ref={stageRef} className="landing-showcase-stage">
      <div className="landing-showcase-heading landing-container"><div><p className="landing-eyebrow">01 / CONHEÇA A EXPERIÊNCIA</p><h2 id="experience-title"><ScrollText mode="letters" disabled={motionDisabled} end={0.72}>Tudo se conecta.</ScrollText><br /><em><ScrollText mode="letters" disabled={motionDisabled} end={0.72}>Inclusive você.</ScrollText></em></h2></div><p>Quatro formas de viver sua fé.<br />Uma experiência que flui com você.<span>{layout.pinned ? 'ROLE PARA EXPLORAR' : 'DESLIZE PARA EXPLORAR'}<ArrowRight size={17} /></span></p></div>
      <div ref={viewportRef} className="landing-showcase-viewport" tabIndex={0} role="region" aria-label="Recursos do OneFlow. Use as setas para explorar." onKeyDown={handleKeyboard}>
        <motion.div ref={trackRef} className="landing-showcase-track" style={layout.pinned ? { x } : { x: 0 }}>
          {features.map((feature, index) => { const Preview = previews[index]; return <article key={feature.id} className={`landing-feature landing-feature--${feature.id}`} onFocusCapture={(event) => revealFocusedCard(index, event)} aria-labelledby={`feature-${feature.id}`}><div className="landing-feature-copy"><span className="landing-feature-index">{feature.number}<feature.Icon size={22} strokeWidth={1.2} /></span><p className="landing-eyebrow">{feature.tag}</p><h3 id={`feature-${feature.id}`}>{feature.title.split('\n').map((line, lineIndex) => <span key={line}>{lineIndex > 0 && <br />}<ScrollText disabled={motionDisabled} end={0.82}>{line}</ScrollText></span>)}</h3><p className="landing-feature-description"><ScrollText disabled={motionDisabled} end={0.86}>{feature.description}</ScrollText></p><Link to={entryPath === '/dashboard' ? ['/bible', '/plans', '/discipleship', '/oneflow-ai'][index] : entryPath} className="landing-text-link">{index === 0 ? 'Abra sua Bíblia' : index === 1 ? 'Encontre seu plano' : index === 2 ? 'Comece uma conexão' : 'Conheça o OneFlow V1'}<ArrowUpRight size={17} /></Link><span className="landing-feature-caption">{index === 0 || index === 1 ? 'PRÉVIA INTERATIVA · EXPERIMENTE AO LADO' : 'UMA PRÉVIA DO QUE VOCÊ ENCONTRA'}</span></div><Preview /></article>; })}
        </motion.div>
      </div>
      <div className="landing-showcase-controls landing-container"><div className="landing-showcase-dots" aria-label="Escolha um recurso">{features.map((feature, index) => <button key={feature.id} onClick={() => goTo(index)} aria-label={`Ver ${feature.tag}`} aria-current={active === index ? 'step' : undefined}><span className={active === index ? 'is-active' : ''} /><small>{feature.number}</small></button>)}</div><span className="landing-showcase-count">{String(active + 1).padStart(2, '0')}<span> / 04</span></span><div className="landing-showcase-arrows"><button aria-label="Recurso anterior" disabled={active === 0} onClick={() => goTo(active - 1)}><ArrowLeft size={18} /></button><button aria-label="Próximo recurso" disabled={active === features.length - 1} onClick={() => goTo(active + 1)}><ArrowRight size={18} /></button></div></div>
    </div>
  </section>;
}
