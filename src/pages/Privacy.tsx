import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import logo from '../assets/logo.png';
import ParticleBackground from '../components/ParticleBackground';

export default function Privacy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <ParticleBackground />
      
      {/* Simple Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para Home
          </motion.button>
          <img src={logo} alt="OneFlow" className="w-24 h-auto object-contain" />
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-6">
        <article className="max-w-4xl mx-auto">
          <header className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40">
                <Shield size={24} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20">Legal & Transparência</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-serif font-bold leading-tight tracking-tighter mb-4"
            >
              Política de <br />
              <span className="italic font-normal text-white/30">Privacidade.</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 font-light italic"
            >
              Última atualização: 12 de Março de 2026
            </motion.p>
          </header>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="prose prose-invert prose-white prose-lg max-w-none space-y-8 text-white/60 font-light leading-relaxed"
          >
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-8">
              <p>
                A sua privacidade é importante para nós. É política do OneFlow respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site OneFlow, e outros sites que possuímos e operamos.
              </p>

              <div className="space-y-4">
                <h2 className="text-2xl font-serif font-bold text-white mt-8 tracking-tight italic">1. Coleta e Uso</h2>
                <p>
                  Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
                </p>
                <p>
                  Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-serif font-bold text-white mt-8 tracking-tight italic">2. Compartilhamento</h2>
                <p>
                  Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
                </p>
                <p>
                  O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-serif font-bold text-white mt-8 tracking-tight italic">3. Seus Direitos</h2>
                <p>
                  Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados.
                </p>
                <p>
                  O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contacto connosco.
                </p>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-8">
                <h2 className="text-2xl font-serif font-bold text-white tracking-tight italic">Google AdSense</h2>
                <p className="text-sm opacity-80">
                  O serviço Google AdSense que usamos para veicular publicidade usa um cookie DoubleClick para veicular anúncios mais relevantes em toda a Web e limitar o número de vezes que um determinado anúncio é exibido para você. Para mais informações sobre o Google AdSense, consulte as FAQs oficiais sobre privacidade do Google AdSense.
                </p>
                <p className="text-sm opacity-80">
                  Utilizamos anúncios para compensar os custos de funcionamento deste site e fornecer financiamento para futuros desenvolvimentos. Os cookies de publicidade comportamental usados por este site foram projetados para garantir que você forneça os anúncios mais relevantes sempre que possível, rastreando anonimamente seus interesses e apresentando coisas semelhantes que possam ser do seu interesse.
                </p>
                <p className="text-sm opacity-80">
                  Vários parceiros anunciam em nosso nome e os cookies de rastreamento de afiliados simplesmente nos permitem ver se nossos clientes acessaram o site através de um dos sites de nossos parceiros, para que possamos creditá-los adequadamente e, quando aplicável, permitir que nossos parceiros afiliados ofereçam qualquer promoção que pode fornecê-lo para fazer uma compra.
                </p>
              </div>

              <div className="space-y-6 border-t border-white/5 pt-8">
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight">Compromisso do Usuário</h2>
                <p>
                  O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o OneFlow oferece no site e com caráter enunciativo, mas não limitativo:
                </p>
                <ul className="list-none space-y-4">
                  {[
                    "A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;",
                    "B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, jogos de sorte ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;",
                    "C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do OneFlow, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados."
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="text-white/20 font-serif italic text-xl">0{i+1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8 border-t border-white/5">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 tracking-tight italic">Mais informações</h2>
                <p>
                  Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.
                </p>
              </div>
            </div>
          </motion.div>
        </article>
      </main>

      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <p className="text-white/20 text-[10px] tracking-[0.3em] uppercase">© 2026 OneFlow Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
