# Login web do OneFlow

O frontend usa Supabase Auth com PKCE. O login começa na origem atual e retorna
para `/auth/callback`, onde o código é trocado por uma sessão uma única vez.

## URLs no Supabase

Em **Authentication → URL Configuration**, configure:

- **Site URL:** `https://oneflowweb.vercel.app`
- **Redirect URLs:** `http://localhost:3000/auth/callback` e
  `https://oneflowweb.vercel.app/auth/callback`.

Se usar outra porta ou `127.0.0.1`, inclua o callback exato dessa origem também.
Um callback de aplicativo, como `oneflowweb://callback`, pode permanecer na
lista de URLs permitidas para um cliente nativo. O retorno padrão deste projeto
web deve usar HTTP ou HTTPS para que o navegador consiga abrir erros de login.

## Callback no Discord

O OAuth2 Redirect do aplicativo Discord deve apontar para o Supabase:

`https://kjtspkqfnkctrhhaqgie.supabase.co/auth/v1/callback`

Esse endereço é diferente do callback do frontend listado acima.

## Erro `bad_oauth_state`

Esse erro indica que o estado devolvido pelo provedor não pôde ser validado.
Feche a aba de autorização antiga e inicie uma nova tentativa em
`http://localhost:3000/auth`, concluindo o fluxo no mesmo navegador e na mesma
origem. Evite reutilizar ou compartilhar a URL de autorização.

Na verificação de 6 de outubro de 2026, o serviço aceitou o callback do localhost
em uma tentativa cancelada com estado válido. Uma tentativa sem estado válido
usou `oneflowweb://callback` como retorno padrão; o navegador não tinha um
aplicativo registrado para abrir esse protocolo.

O callback web exibe falhas e oferece uma nova tentativa. Se o serviço não
responder em 20 segundos, a tela disponibiliza os controles de recuperação.

Documentação: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls),
[login com Discord](https://supabase.com/docs/guides/auth/social-login/auth-discord)
e [códigos de erro](https://supabase.com/docs/guides/auth/debugging/error-codes).
