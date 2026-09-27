import { useState, useCallback } from 'react';

/**
 * Hook reutilizável para copiar um link com feedback
 * temporário de "COPIADO".
 */
export function useCopyLink() {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        } catch {
            window.prompt('Copie o link do perfil:', url);
        }
    }, []);

    return { copied, copy };
}
