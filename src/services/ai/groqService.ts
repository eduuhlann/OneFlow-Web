const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export const callGroqAPI = async (prompt: string, model: string = 'llama-3.3-70b-versatile'): Promise<string> => {
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    if (!GROQ_API_KEY) {
        throw new Error('GROQ API Key is missing.');
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2048,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro na chamada da API Groq (${response.status})`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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

        const text = await callGroqAPI(prompt);
        
        let jsonData = null;
        try {
            // Priority 1: Clean JSON parse
            jsonData = JSON.parse(text);
        } catch (e) {
            try {
                // Priority 2: Extract JSON from markdown blocks or generic {} matches
                const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                }
            } catch (innerE) {
                console.error('Inner parsing error:', innerE);
            }
        }

        if (!jsonData) {
            throw new Error('Could not parse valid JSON from AI response');
        }

        return jsonData;
    } catch (error) {
        console.error('Error generating chapter lesson:', error);
        return null;
    }
};

export const callGroqChat = async (
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    model: string = 'llama-3.3-70b-versatile'
): Promise<string> => {
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    if (!GROQ_API_KEY) {
        throw new Error('GROQ API Key is missing.');
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 2048,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro na chamada da API Groq (${response.status})`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
};
