import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, FileText, ShieldCheck, ChevronRight, Scale } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const LegalView: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'main' | 'terms' | 'privacy'>('main');

const sections = [
        { 
            id: 'terms', 
            title: 'Termos de Uso', 
            icon: FileText, 
            content: `1. Termos
Ao acessar ao site OneFlow, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.

2. Uso de Licença
É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site OneFlow , apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode: modificar ou copiar os materiais; usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial); tentar de compilar ou fazer engenharia reversa de qualquer software contido no site OneFlow; remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor. Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por OneFlow a qualquer momento. Ao encerrar a visualização desses materiais ou após o término desta licença, você deve apagar todos os materiais baixados em sua posse, seja em formato eletrónico ou impresso.

3. Isenção de responsabilidade
Os materiais no site da OneFlow são fornecidos 'como estão'. OneFlow não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos. Além disso, o OneFlow não garante ou faz qualquer representação relativa à precisão, aos resultados prováveis ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site.

4. Limitações
Em nenhum caso o OneFlow ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em OneFlow, mesmo que OneFlow ou um representante autorizado da OneFlow tenha sido notificado oralmente ou por escrito da possibilidade de tais danos. Como algumas jurisdições não permitem limitações em garantias implícitas, ou limitações de responsabilidade por danos conseqüentes ou incidentais, essas limitações podem não se aplicar a você.

5. Precisão dos materiais
Os materiais exibidos no site da OneFlow podem incluir erros técnicos, tipográficos ou fotográficos. OneFlow não garante que qualquer material em seu site seja preciso, completo ou atual. OneFlow pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, OneFlow não se compromete a atualizar os materiais.

6. Links
O OneFlow não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por OneFlow do site. O uso de qualquer site vinculado é por conta e risco do usuário.

Modificações
O OneFlow pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.

Lei aplicável
Estes termos e condições são regidos e interpretados de acordo com as leis do OneFlow e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.`,
            updatedAt: '12 de Março de 2026'
        },
        { 
            id: 'privacy', 
            title: 'Política de Privacidade', 
            icon: ShieldCheck, 
            content: `A sua privacidade é importante para nós. É política do OneFlow respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site OneFlow, e outros sites que possuímos e operamos.

Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.

Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.

Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.

O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade.

Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados.

O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contacto connosco.

Google AdSense
O serviço Google AdSense que usamos para veicular publicidade usa um cookie DoubleClick para veicular anúncios mais relevantes em toda a Web e limitar o número de vezes que um determinado anúncio é exibido para você. Para mais informações sobre o Google AdSense, consulte as FAQs oficiais sobre privacidade do Google AdSense. Utilizamos anúncios para compensar os custos de funcionamento deste site e fornecer financiamento para futuros desenvolvimentos. Os cookies de publicidade comportamental usados por este site foram projetados para garantir que você forneça os anúncios mais relevantes sempre que possível, rastreando anonimamente seus interesses e apresentando coisas semelhantes que possam ser do seu interesse. Vários parceiros anunciam em nosso nome e os cookies de rastreamento de afiliados simplesmente nos permitem ver se nossos clientes acessaram o site através de um dos sites de nossos parceiros, para que possamos creditá-los adequadamente e, quando aplicável, permitir que nossos parceiros afiliados ofereçam qualquer promoção que pode fornecê-lo para fazer uma compra.

Compromisso do Usuário
O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o OneFlow oferece no site e com caráter enunciativo, mas não limitativo:
A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;
B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, jogos de sorte ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;
C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do OneFlow, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.

Mais informações
Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.`,
            updatedAt: '12 de Março de 2026'
        }
    ];

    return (
        <div className="space-y-12">
            <AnimatePresence mode="wait">
                {activeSection === 'main' ? (
                    <motion.div
                        key="main-legal"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-12"
                    >
                        <div>
                            <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase block mb-2">Legal & Transparência</span>
                            <h2 className="text-3xl font-black italic -rotate-1 tracking-tighter">Termos e Privacidade</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id as any)}
                                    className="p-10 bg-white/5 border border-white/10 rounded-[3rem] flex items-center justify-between group hover:bg-white/10 transition-all text-left"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                                            <section.icon size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-black italic tracking-tighter text-2xl mb-1">{section.title}</h4>
                                            <p className="text-white/30 text-xs font-medium tracking-wide italic">Última atualização: {section.updatedAt}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={24} className="text-white/10 group-hover:text-white transition-colors" />
                                </button>
                            ))}

                            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] flex items-center gap-8">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20">
                                    <Scale size={28} />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[8px] font-bold tracking-[0.3em] text-white/20 uppercase block mb-1">Conformidade Global</span>
                                    <p className="text-white/40 text-[10px] font-medium leading-relaxed italic">
                                        O OneFlow opera em conformidade com as principais regulamentações de proteção de dados (LGPD e GDPR).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content-legal"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-12"
                    >
                        <button 
                            onClick={() => setActiveSection('main')}
                            className="flex items-center gap-2 text-[10px] font-black tracking-widest text-white/40 uppercase hover:text-white transition-colors"
                        >
                            <ChevronRight size={14} className="rotate-180" /> VOLTAR PARA LEGAL
                        </button>

                        <div className="space-y-8">
                            <h2 className="text-4xl font-black italic -rotate-1 tracking-tighter">
                                {sections.find(s => s.id === activeSection)?.title}
                            </h2>
                            
                            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] prose prose-invert max-w-none">
                                <p className="text-white/60 font-medium text-lg leading-relaxed whitespace-pre-wrap italic">
                                    {sections.find(s => s.id === activeSection)?.content}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LegalView;
