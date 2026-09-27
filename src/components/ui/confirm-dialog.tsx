import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ConfirmDialogProps = {
    isOpen: boolean;
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Quando true, exibe um campo de texto e passa o valor para onConfirm. */
    withInput?: boolean;
    inputLabel?: string;
    inputPlaceholder?: string;
    /** Quando definido, o botão só habilita com o texto exato. */
    requiredText?: string;
    danger?: boolean;
    onConfirm: (value: string) => void | Promise<void>;
    onCancel: () => void;
};

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    withInput = false,
    inputLabel = 'Digite aqui',
    inputPlaceholder,
    requiredText,
    danger = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const [value, setValue] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (isOpen) { setValue(''); setBusy(false); }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onCancel]);

    const locked = Boolean(requiredText) && value.trim().toUpperCase() !== requiredText;

    const submit = async () => {
        if (busy || locked) return;
        setBusy(true);
        try {
            await onConfirm(value);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 8 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#1a1a1a] border border-white/10 p-8 rounded-[32px] w-full max-w-sm shadow-2xl space-y-6"
                    >
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold italic tracking-tight">{title}</h3>
                            <div className="text-sm text-white/ leading-relaxed">{message}</div>
                        </div>

                        {withInput && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/">
                                    {inputLabel}
                                    {requiredText && (
                                        <span className="ml-1 text-white/ normal-case tracking-normal font-medium">
                                            (digite {requiredText})
                                        </span>
                                    )}
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                                    placeholder={inputPlaceholder}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/ outline-none focus:border-white/30 transition-colors"
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={submit}
                                disabled={busy || locked}
                                className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 ${
                                    danger
                                        ? 'bg-red-500 text-white hover:bg-red-400'
                                        : 'bg-white text-black hover:scale-[1.02] active:scale-95'
                                }`}
                            >
                                {busy ? 'Aguarde...' : confirmLabel}
                            </button>
                            <button
                                onClick={onCancel}
                                disabled={busy}
                                className="w-full py-4 bg-white/5 text-white/ text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                                {cancelLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
