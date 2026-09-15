const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const callGeminiAPI = async (prompt: string): Promise<string> => {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API Key is missing.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro na chamada da API Gemini (${response.status})`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
};

export const callGeminiChat = async (
    messages: { role: 'user' | 'model'; content: string }[],
    systemInstruction?: string
): Promise<string> => {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API Key is missing.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const formattedContents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: formattedContents,
            system_instruction: systemInstruction ? {
                parts: [{ text: systemInstruction }]
            } : undefined,
            generationConfig: {
                temperature: 0.9,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro na chamada da API Gemini (${response.status})`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
};
