/**
 * Detecta o erro do PostgREST quando a coluna ainda não existe no banco
 * (ou seja, a migration ainda não foi aplicada no Supabase).
 */
export function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
    if (!error) return false;
    return error.code === '42703' || error.code === 'PGRST204' || /does not exist/i.test(error.message || '');
}

/** Detecta função RPC inexistente (ex.: delete_account antes da migration) */
export function isMissingFunctionError(error: { code?: string; message?: string } | null): boolean {
    if (!error) return false;
    return (
        error.code === '42883' ||
        error.code === 'PGRST202' ||
        /does not exist|not found/i.test(error.message || '')
    );
}
