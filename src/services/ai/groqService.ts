const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_MODELS = {
    primary: 'openai/gpt-oss-120b',
    fallback: 'qwen/qwen3.8-27b',
} as const;

export type GroqMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export interface GroqOptions {
    model?: string;
    json?: boolean;
    temperature?: number;
    maxTokens?: number;
}

const postToGroq = async (model: string, messages: GroqMessage[], opts: GroqOptions): Promise<string> => {
    const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: opts.temperature ?? 0.7,
            max_tokens: opts.maxTokens ?? 2048,
            ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.error?.message || `Erro na chamada da API Groq (${response.status})`;
        const err = new Error(message) as Error & { status?: number };
        err.status = response.status;
        throw err;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
        const reason = data?.choices?.[0]?.finish_reason;
        const err = new Error(
            reason === 'length'
                ? 'A resposta da IA ficou incompleta. Tente um plano mais curto.'
                : 'A IA retornou uma resposta vazia.'
        ) as Error & { status?: number };
        err.status = 500;
        throw err;
    }

    return content;
};

const requestGroq = async (messages: GroqMessage[], opts: GroqOptions = {}): Promise<string> => {
    if (!GROQ_API_KEY) {
        throw new Error('Chave da Groq não configurada (VITE_GROQ_API_KEY).');
    }

    const models = [opts.model ?? GROQ_MODELS.primary, GROQ_MODELS.fallback]
        .filter((model, index, list) => list.indexOf(model) === index);

    let lastError: Error | null = null;

    for (const model of models) {
        try {
            return await postToGroq(model, messages, opts);
        } catch (error: any) {
            lastError = error;
            // Chave inválida ou erro do prompt: não adianta trocar de modelo.
            if (error?.status === 401 || error?.status === 403 || error?.status === 400) {
                throw error;
            }
            console.warn(`Groq falhou com ${model}:`, error?.message);
        }
    }

    throw lastError || new Error('Erro desconhecido na chamada à API Groq.');
};

const extractJson = (text: string): any => {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[1] || match[0]);
        throw new Error('Não foi possível ler o JSON retornado pela IA.');
    }
};

export const callGroqAPI = async (prompt: string, model?: string, opts: GroqOptions = {}): Promise<string> => {
    return requestGroq([{ role: 'user', content: prompt }], { ...opts, model });
};

export const callGroqChat = async (messages: GroqMessage[], model?: string, opts: GroqOptions = {}): Promise<string> => {
    return requestGroq(messages, { ...opts, model });
};

export const generateChapterLesson = async (book: string, chapter: number, version: string = 'nvi') => {
    if (!GROQ_API_KEY) return null;

    try {
        const prompt = `
      Atue como um teólogo e professor bíblico de nível acadêmico.
      O usuário acabou de ler o capítulo ${chapter} do livro de ${book} na versão ${version}.

      Gere uma "Lição do Capítulo" completa contendo:
      1. Título Criativo (curto, max 5 palavras, sem emoji)
      2. Contexto Histórico (2-3 frases sobre: período histórico, autor, destinatários, e situação política/cultural que motivou a escrita)
      3. Devocional (2-3 parágrafos explicando o ponto teológico central do capítulo)
      4. Aplicação Prática (uma ação concreta e específica para hoje, começando com verbo no imperativo, max 2 frases)
      5. Quiz DIFÍCIL - 5 perguntas que testem conhecimento ESPECÍFICO

      Retorne APENAS um JSON válido no formato:
      {
        "title": "Título aqui",
        "historicalContext": "Contexto histórico...",
        "devotional": "Texto do devocional...",
        "application": "Hoje, faça...",
        "quiz": [
          {
            "question": "Pergunta",
            "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "correctAnswer": 0,
            "explanation": "Explicação"
          }
        ]
      }`;

        return extractJson(await callGroqAPI(prompt, undefined, { json: true, temperature: 0.6, maxTokens: 4096 }));
    } catch (error) {
        console.error('Error generating chapter lesson:', error);
        return null;
    }
};
