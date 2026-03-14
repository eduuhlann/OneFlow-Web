export const translateAuthError = (message: string): string => {
    const errorMap: Record<string, string> = {
        'User already registered': 'Este e-mail já está cadastrado.',
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Invalid email': 'E-mail inválido.',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
        'Email not confirmed': 'E-mail não confirmado. Verifique sua caixa de entrada.',
        'Signup confirmations not enabled': 'Confirmações de cadastro desativadas.',
        'Too many requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'New password should be different from the old password': 'A nova senha deve ser diferente da antiga.',
        'User not found': 'Usuário não encontrado.'
    };

    // Check for exact matches first
    if (errorMap[message]) return errorMap[message];

    // Check for partial matches or common substrings if needed
    if (message.includes('already registered')) return 'Este e-mail já está cadastrado.';
    if (message.includes('login credentials')) return 'E-mail ou senha incorretos.';
    if (message.includes('at least 6 characters')) return 'A senha deve ter pelo menos 6 caracteres.';

    return 'Ocorreu um erro inesperado. Tente novamente.';
};
