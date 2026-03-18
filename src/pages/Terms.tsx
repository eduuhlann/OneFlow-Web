import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import logo from '../assets/logo.png';
import ParticleBackground from '../components/ParticleBackground';

export default function Terms() {
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
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para o App
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
                <Scale size={24} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20">Legal & Transparência</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-serif font-bold leading-tight tracking-tighter mb-4"
            >
              Termos de <br />
              <span className="italic font-normal text-white/30">Serviço.</span>
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
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-12">
              
              <section className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight italic flex items-center gap-4">
                  <span className="text-white/10 not-italic">01</span> 1. Termos
                </h2>
                <div className="pl-14">
                  <p>
                    Ao acessar ao site OneFlow, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight italic flex items-center gap-4">
                  <span className="text-white/10 not-italic">02</span> 2. Uso de Licença
                </h2>
                <div className="pl-14 space-y-4">
                  <p>
                    É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site OneFlow , apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:
                  </p>
                  <ul className="list-disc space-y-2 pl-4 opacity-80">
                    <li>modificar ou copiar os materiais;</li>
                    <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);</li>
                    <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido no site OneFlow;</li>
                    <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
                    <li>transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</li>
                  </ul>
                  <p>
                    Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por OneFlow a qualquer momento. Ao encerrar a visualização desses materiais ou após o término desta licença, você deve apagar todos os materiais baixados em sua posse, seja em formato eletrónico ou impresso.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight italic flex items-center gap-4">
                  <span className="text-white/10 not-italic">03</span> 3. Isenção de responsabilidade
                </h2>
                <div className="pl-14">
                  <p>
                    Os materiais no site da OneFlow são fornecidos 'como estão'. OneFlow não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.
                  </p>
                  <p className="mt-4">
                    Além disso, o OneFlow não garante ou faz qualquer representação relativa à precisão, aos resultados prováveis ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight italic flex items-center gap-4">
                  <span className="text-white/10 not-italic">04</span> 4. Limitações
                </h2>
                <div className="pl-14">
                  <p>
                    Em nenhum caso o OneFlow ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em OneFlow, mesmo que OneFlow ou um representante autorizado da OneFlow tenha sido notificado oralmente ou por escrito da possibilidade de tais danos. Como algumas jurisdições não permitem limitações em garantias implícitas, ou limitações de responsabilidade por danos conseqüentes ou incidentais, essas limitações podem não se aplicar a você.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight italic flex items-center gap-4">
                  <span className="text-white/10 not-italic">05</span> 5. Precisão dos materiais
                </h2>
                <div className="pl-14">
                  <p>
                    Os materiais exibidos no site da OneFlow podem incluir erros técnicos, tipográficos ou fotográficos. OneFlow não garante que qualquer material em seu site seja preciso, completo ou atual. OneFlow pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, OneFlow não se compromete a atualizar os materiais.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-white tracking-tight italic flex items-center gap-4">
                  <span className="text-white/10 not-italic">06</span> 6. Links
                </h2>
                <div className="pl-14">
                  <p>
                    O OneFlow não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por OneFlow do site. O uso de qualquer site vinculado é por conta e risco do usuário.
                  </p>
                </div>
              </section>

              <div className="pt-8 border-t border-white/5 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Modificações</h3>
                  <p>O OneFlow pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Lei aplicável</h3>
                  <p>Estes termos e condições são regidos e interpretados de acordo com as leis do OneFlow e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.</p>
                </div>
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
