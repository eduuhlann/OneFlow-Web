import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  LoaderCircle,
  MessageSquarePlus,
  Send,
  Trash2,
} from 'lucide-react';
import { IconBible } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { callGeminiChat } from '../services/ai/geminiService';

type ChatMessage = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

const STORAGE_KEY = 'oneflow-ai-conversations';
const SYSTEM_INSTRUCTION =
  'Seu nome é OneFlow V1. Você é uma inteligência artificial útil, clara e acolhedora, e responde em português brasileiro por padrão. Responda com precisão, organize respostas longas em tópicos e admita quando não souber algo. Você pode ajudar com temas gerais e também com estudos bíblicos quando solicitado.';

const createConversation = (): Conversation => ({
  id: crypto.randomUUID(),
  title: 'Nova conversa',
  messages: [],
  updatedAt: Date.now(),
});

function readConversations(): Conversation[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [createConversation()];

    const parsed: unknown = JSON.parse(saved);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (item) =>
          typeof item?.id === 'string' &&
          typeof item?.title === 'string' &&
          Array.isArray(item?.messages) &&
          typeof item?.updatedAt === 'number',
      )
    ) {
      return parsed.length > 0 ? parsed : [createConversation()];
    }
  } catch (error) {
    console.error('Não foi possível carregar o histórico do OneFlow V1:', error);
  }

  return [createConversation()];
}

const suggestions = [
  'Me ajude a organizar minha semana',
  'Explique um conceito de forma simples',
  'Sugira um plano de estudos para mim',
];

export default function OneFlowAI() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(readConversations);
  const [activeId, setActiveId] = useState(() => conversations[0]?.id ?? '');
  const [prompt, setPrompt] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? conversations[0];
  const isGenerating = generatingId === activeConversation?.id;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (storageError) {
      console.error('Não foi possível salvar o histórico do OneFlow V1:', storageError);
    }
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeConversation?.messages, isGenerating]);

  const startConversation = () => {
    const conversation = createConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveId(conversation.id);
    setPrompt('');
    setError('');
    setShowHistory(false);
  };

  const removeConversation = (id: string) => {
    const remaining = conversations.filter((conversation) => conversation.id !== id);
    const next = remaining.length > 0 ? remaining : [createConversation()];
    setConversations(next);
    if (activeId === id) setActiveId(next[0].id);
    setError('');
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || !activeConversation || generatingId) return;

    const conversationId = activeConversation.id;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    const nextMessages = [...activeConversation.messages, userMessage];

    setPrompt('');
    setError('');
    setGeneratingId(conversationId);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title:
                conversation.messages.length === 0
                  ? content.slice(0, 42) + (content.length > 42 ? '…' : '')
                  : conversation.title,
              messages: nextMessages,
              updatedAt: Date.now(),
            }
          : conversation,
      ),
    );

    try {
      const reply = await callGeminiChat(
        nextMessages.map(({ role, content: messageContent }) => ({
          role,
          content: messageContent,
        })),
        SYSTEM_INSTRUCTION,
      );
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: reply,
      };
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...conversation.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : conversation,
        ),
      );
    } catch (requestError) {
      console.error('Falha ao gerar resposta no OneFlow V1:', requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível obter uma resposta. Tente novamente.',
      );
    } finally {
      setGeneratingId(null);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  if (!activeConversation) return null;

  return (
    <PageTransition>
      <main className="flex h-[100dvh] min-h-[520px] bg-[#080808] font-sans text-white">
        <aside
          className={`${
            showHistory ? 'flex' : 'hidden'
          } fixed inset-0 z-30 w-full flex-col border-r border-white/[0.08] bg-[#0c0c0c] p-4 md:static md:flex md:w-[270px] md:shrink-0`}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="rounded-lg px-3 py-2 text-xs text-white/60 md:hidden"
            >
              Fechar
            </button>
          </div>

          <button
            type="button"
            onClick={startConversation}
            className="mt-6 flex w-full items-center gap-3 rounded-xl border border-white/[0.1] px-3 py-3 text-sm font-medium text-white/90 transition hover:bg-white/[0.06]"
          >
            <MessageSquarePlus size={17} aria-hidden="true" />
            Nova conversa
          </button>

          <h2 className="mb-2 mt-7 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Recentes
          </h2>
          <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-lg ${
                  conversation.id === activeConversation.id
                    ? 'bg-white/[0.08]'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(conversation.id);
                    setError('');
                    setShowHistory(false);
                  }}
                  className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-xs text-white/75"
                  aria-current={conversation.id === activeConversation.id ? 'page' : undefined}
                >
                  {conversation.title}
                </button>
                <button
                  type="button"
                  onClick={() => removeConversation(conversation.id)}
                  aria-label={`Excluir conversa ${conversation.title}`}
                  className="mr-1 rounded-md p-2 text-white/35 opacity-100 transition hover:bg-white/10 hover:text-white md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-white/[0.08] pt-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
              <IconBible size={15} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-white">OneFlow V1</p>
              <p className="text-[10px] text-white/45">Seu assistente de IA</p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.08] px-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                aria-label="Abrir histórico de conversas"
                className="rounded-lg p-2 text-white/70 hover:bg-white/[0.07] md:hidden"
              >
                <MessageSquarePlus size={19} aria-hidden="true" />
              </button>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black">
                <IconBible size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold tracking-tight">OneFlow V1</h1>
                <p className="text-[10px] text-white/45">Seu assistente inteligente</p>
              </div>
            </div>
            <button
              type="button"
              onClick={startConversation}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              <MessageSquarePlus size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Nova conversa</span>
            </button>
          </header>

          <div className="custom-scrollbar flex-1 overflow-y-auto px-4 sm:px-8">
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col py-8 sm:py-12">
              {activeConversation.messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center pb-8 text-center">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <IconBible size={25} className="text-white/85" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Como posso ajudar?
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/45">
                    Converse com a OneFlow V1. Pergunte, explore ideias ou comece por uma sugestão.
                  </p>
                  <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-3">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setPrompt(suggestion)}
                        className="rounded-xl border border-white/[0.09] bg-white/[0.025] p-3 text-left text-xs leading-relaxed text-white/65 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 pb-8">
                  {activeConversation.messages.map((message) => (
                    <article
                      key={message.id}
                      className={`flex gap-3 sm:gap-4 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'model' && (
                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black">
                          <IconBible size={15} aria-hidden="true" />
                        </span>
                      )}
                      <div
                        className={`max-w-[88%] text-sm leading-7 sm:max-w-[78%] ${
                          message.role === 'user'
                            ? 'rounded-2xl bg-[#1d1d1d] px-4 py-3 text-white'
                            : 'min-w-0 flex-1 text-white/85'
                        }`}
                      >
                        {message.role === 'model' ? (
                          <div className="prose prose-invert prose-sm max-w-none break-words prose-p:my-3 prose-headings:mb-2 prose-headings:mt-5 prose-li:my-1 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-[#151515] prose-code:text-white/90">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </article>
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-3 text-sm text-white/50" role="status">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                        <IconBible size={15} aria-hidden="true" />
                      </span>
                      <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                      <span>OneFlow V1 está pensando...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-6">
            <div className="mx-auto max-w-3xl">
              {error && (
                <p className="mb-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs leading-relaxed text-red-200" role="alert">
                  Não foi possível gerar a resposta: {error}
                </p>
              )}
              <form
                onSubmit={sendMessage}
                className="rounded-2xl border border-white/[0.12] bg-[#141414] p-2 shadow-lg transition focus-within:border-white/25"
              >
                <label className="sr-only" htmlFor="oneflow-prompt">
                  Envie uma mensagem para OneFlow V1
                </label>
                <textarea
                  id="oneflow-prompt"
                  rows={1}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Pergunte alguma coisa"
                  disabled={Boolean(generatingId)}
                  className="max-h-40 min-h-11 w-full resize-y bg-transparent px-3 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/35 disabled:opacity-50"
                />
                <div className="flex items-center justify-between px-1 pb-1">
                  <p className="hidden text-[10px] text-white/35 sm:block">
                    Enter para enviar · Shift + Enter para nova linha
                  </p>
                  <button
                    type="submit"
                    disabled={!prompt.trim() || Boolean(generatingId)}
                    aria-label="Enviar mensagem"
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                  >
                    {isGenerating ? (
                      <ArrowDown size={17} className="animate-pulse" aria-hidden="true" />
                    ) : (
                      <Send size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </form>
              <p className="mt-2 text-center text-[10px] text-white/30">
                A OneFlow V1 pode cometer erros. Verifique informações importantes.
              </p>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
