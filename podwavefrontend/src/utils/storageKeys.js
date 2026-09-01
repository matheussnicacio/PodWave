// Chaves usadas para persistir a sessão no localStorage.
// Este arquivo não importa nada (nem Pinia, nem services) de propósito:
// tanto stores/auth.js quanto services/api.js precisam dessas chaves, e se
// um desses dois arquivos importasse a chave direto do outro, criaria uma
// dependência circular (stores/auth.js -> services/authService.js ->
// services/api.js -> stores/auth.js). Um módulo neutro, sem dependências,
// quebra esse ciclo.
export const TOKEN_STORAGE_KEY = 'podwave_token'
export const USER_STORAGE_KEY = 'podwave_user'
