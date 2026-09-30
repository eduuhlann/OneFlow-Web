import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Search, ChevronDown, MessageSquare, BookOpen, Users, Settings as SettingsIcon, Rocket, X } from 'lucide-react';
import PageTransition from '../components/PageTransition';

type FaqItem = {
    q: string;
    a: string;
    tags: string[];
};

type FaqCategory = {
    id: string;
    title: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    items: FaqItem[];
};

const CATEGORIES: FaqCategory[] = [
    {
        id: 'primeiros-passos',
        title: 'Primeiros passos',
        icon: Rocket,
        items: [
            { q: 'Como funciona o OneFlow?', a: 'O OneFlow reúne sua jornada de fé em um só lugar: leitura da Bíblia, planos de leitura, discipulado em grupo, oração e perfis públicos. Você navega pelos módulos pelo menu inferior (celular) ou pelo painel (computador).', tags: ['inicio', 'sobre', 'app', 'tutorial'] },
            { q: 'Preciso pagar para usar?', a: 'Não. O OneFlow é totalmente gratuito para todos: banner personalizado, grupos de discipulado, geração de planos com IA e perfis públicos estão liberados para toda pessoa.', tags: ['gratis', 'preco', 'pago', 'gratuito'] },
        ],
    },
    {
        id: 'biblia-planos',
        title: 'Bíblia e planos',
        icon: BookOpen,
        items: [
            { q: 'Como funciona o plano de leitura?', a: 'Em Planos você escolhe um tema, define quantos capítulos por dia e o OneFlow gera a sequência. Marcar o capítulo como lido atualiza seu progresso e ostreak.', tags: ['plano', 'leitura', 'progresso', 'streak'] },
            { q: 'Posso gerar um plano com IA?', a: 'Sim. A página “Gerador com IA” cria um plano sob medida a partir do seu objetivo, tempo disponível e nível de aprofundamento.', tags: ['ia', 'ai', 'groq', 'plano', 'gerar'] },
            { q: 'Onde vejo meu progresso da Bíblia?', a: 'No topo da página da Bíblia você acompanha capítulos lidos, sequência de dias e o total por livro. O mesmo número aparece no painel.', tags: ['biblia', 'progresso', 'estatisticas', 'caps'] },
            { q: 'Posso dividir o plano com alguém?', a: 'Sim. Os planos podem ser compartilhados pelo link público, e cada pessoa tem o próprio progresso, sem afetar o seu.', tags: ['compartilhar', 'link', 'publico', 'plano'] },
        ],
    },
    {
        id: 'discipulado',
        title: 'Discipulado e chat',
        icon: Users,
        items: [
            { q: 'Qual a diferença entre conexão e grupo?', a: 'Uma conexão é entre duas pessoas e já libera conversa direta. Um grupo reúne várias pessoas, com leitor de challenges, arquivos e，ões coletivas.', tags: ['conexao', 'grupo', 'chat', 'diferenca'] },
            { q: 'Como recebo convites e solicitações?', a: 'Solicitações de conexão aparecem no sino de notificações, no topo da tela: é só aceitar ou recusar. Convites de grupo aparecem na lista do Discipulado com o nome de quem convidou.', tags: ['convite', 'solicitacao', 'notificacao', 'sino', 'aceitar'] },
            { q: 'Como menciono alguém na conversa?', a: 'Digite @ seguido do nome de usuário. Uma lista de sugestões aparece; escolha com as setas e confirme com Enter ou Tab. A menção fica destacada e leva ao perfil da pessoa.', tags: ['mencao', 'arroba', 'at', 'mention', 'usuario'] },
            { q: 'Um grupo pode ter senha?', a: 'Sim. Na criação do grupo, preencha “Senha do grupo”. Quem receber o convite precisa digitar a senha para entrar. Se deixar em branco, o grupo fica aberto a quem tiver o convite.', tags: ['senha', 'grupo', 'protegido', 'privado'] },
            { q: 'Como sei que a pessoa está digitando?', a: 'Aparece “fulano está digitando...” acima do campo de mensagem, e some automaticamente quando a mensagem é enviada ou o campo perde o foco.', tags: ['digitando', 'typing', 'presenca', 'online'] },
        ],
    },
    {
        id: 'perfil',
        title: 'Perfil e conta',
        icon: SettingsIcon,
        items: [
            { q: 'Onde edito meu perfil?', a: 'Em Configurações → Editar Perfil. Você pode trocar avatar, banner, nome, bio curta (até 60 caracteres), biografia completa e usuário.', tags: ['perfil', 'editar', 'avatar', 'bio'] },
            { q: 'O que é a bio curta?', a: 'A bio curta é uma frase de até 60 caracteres que aparece junto do seu nome em todo lugar, inclusive no card de compartilhamento.', tags: ['bio', 'curta', 'card', 'compartilhar'] },
            { q: 'Como compartilho meu perfil?', a: 'Copie o link /u/seu-usuario na página do seu perfil. A bio curta aparece no topo, e quem abrir o link não precisa ter conta.', tags: ['link', 'compartilhar', 'publico', 'url'] },
            { q: 'Como excluo minha conta?', a: 'Em Configurações → Segurança → Excluir Minha Conta. Você precisa digitar EXCLUIR para confirmar, e a remoção é definitiva: perfil, grupos e conversas são apagados.', tags: ['excluir', 'deletar', 'conta', 'remover', 'seguranca'] },
        ],
    },
];

const normalize = (value: string) =>
    value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Help() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [openIds, setOpenIds] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const filtered = useMemo(() => {
        const q = normalize(query.trim());
        const list = CATEGORIES
            .filter((c) => activeCategory === 'all' || c.id === activeCategory)
            .map((c) => ({
                ...c,
                items: q
                    ? c.items.filter((item) => normalize(`${item.q} ${item.a} ${item.tags.join(' ')}`).includes(q))
                    : c.items,
            }))
            .filter((c) => c.items.length > 0);
        return list;
    }, [query, activeCategory]);

    const totalResults = filtered.reduce((acc, c) => acc + c.items.length, 0);

    const toggle = (key: string) =>
        setOpenIds((prev) => (prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]));

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-white/20">
                <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-white/[0.05] rounded-full blur-[140px]" />
                </div>

                <div className="relative z-10 max-w-3xl mx-auto px-5 md:px-0 py-4 md:py-10 pb-24">
                    <header className="flex items-center gap-6 mb-10">
                        <button
                            onClick={() => navigate(-1)}
                            className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all text-white/ hover:text-white"
                        >
                            <ArrowLeft size={22}  />
                        </button>
                        <div>
                            <span className="text-[10px] font-bold tracking-[0.4em] text-white/ uppercase block">Central de ajuda</span>
                            <h1 className="text-3xl sm:text-4xl font-serif font-black italic -rotate-1 tracking-tighter">Como posso ajudar?</h1>
                        </div>
                    </header>

                    {/* Busca (#148) */}
                    <div className="relative mb-8">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/ pointer-events-none" />
                        <input
                            autoFocus
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por senha, grupo, versículo, plano..."
                            className="w-full bg-white/[0.03] border border-white/10 rounded-[1.75rem] pl-14 pr-12 py-4 text-sm text-white placeholder:text-white/ outline-none focus:border-white/25 transition-colors"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/5 text-white/ hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Categorias */}
                    <div className="flex flex-wrap gap-2 mb-10">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                                activeCategory === 'all'
                                    ? 'bg-white text-black border-white'
                                    : 'bg-white/[0.03] border-white/10 text-white/ hover:text-white'
                            }`}
                        >
                            Tudo
                        </button>
                        {CATEGORIES.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setActiveCategory(c.id)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                                    activeCategory === c.id
                                        ? 'bg-white text-black border-white'
                                        : 'bg-white/[0.03] border-white/10 text-white/ hover:text-white'
                                }`}
                            >
                                {c.title}
                            </button>
                        ))}
                    </div>

                    {query && (
                        <p className="text-[10px] font-bold tracking-[0.2em] text-white/ uppercase mb-6">
                            {totalResults} resultado{totalResults === 1 ? '' : 's'} para “{query}”
                        </p>
                    )}

                    {filtered.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <Search size={40} className="mx-auto text-white/80" />
                            <p className="text-white/ text-sm">Nenhuma resposta encontrada.</p>
                            <p className="text-white/ text-xs">Tente outras palavras ou use o botão de feedback.</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {filtered.map((cat) => (
                                <section key={cat.id}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <cat.icon size={16} className="text-white/" />
                                        <h2 className="text-[11px] font-black tracking-[0.3em] text-white/ uppercase">{cat.title}</h2>
                                    </div>

                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden divide-y divide-white/5">
                                        {cat.items.map((item, i) => {
                                            const key = `${cat.id}-${i}`;
                                            const open = openIds.includes(key);
                                            return (
                                                <div key={key}>
                                                    <button
                                                        onClick={() => toggle(key)}
                                                        className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-white/[0.03] transition-colors"
                                                    >
                                                        <span className="text-sm font-bold text-white/85 tracking-tight">{item.q}</span>
                                                        <ChevronDown size={16} className={`shrink-0 text-white/ transition-transform ${open ? 'rotate-180 text-white/' : ''}`} />
                                                    </button>
                                                    <motion.div
                                                        initial={false}
                                                        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="px-6 pb-6 text-[13px] leading-relaxed text-white/">{item.a}</p>
                                                    </motion.div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}

                    <div className="mt-16 p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] text-center space-y-5">
                        <MessageSquare size={24} className="mx-auto text-white/" />
                        <p className="text-sm font-bold text-white/70">Ainda ficou com dúvida?</p>
                        <p className="text-xs text-white/">Abra Configurações e use “Enviar Feedback” para falar direto com a equipe.</p>
                        <button
                            onClick={() => navigate('/settings')}
                            className="px-6 py-3.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Ir para Configurações
                        </button>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
