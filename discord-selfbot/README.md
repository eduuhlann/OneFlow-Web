# Discord Decoration Selfbot 🎨

Servidor local que usa seu **token de usuário do Discord** (selfbot) para buscar todas as suas decorações de avatar e servir para o OneFlow Web.

## Setup

```bash
cd discord-selfbot
npm install
npm start
```

O servidor sobe em `http://localhost:3001`.

## Como obter seu token do Discord

1. Abra o Discord **no navegador** (discord.com)
2. Pressione **F12** → aba **Network**
3. Filtre por `api.` e clique em qualquer requisição
4. No cabeçalho da requisição, procure por `Authorization:` → esse é seu token
5. Cole o token no campo que aparecerá na página do OneFlow ao clicar em "Puxar do Discord"

> ⚠️ **Atenção**: Nunca compartilhe seu token com ninguém. Ele dá acesso total à sua conta.

## Endpoint

```
POST http://localhost:3001/decorations
Content-Type: application/json

{ "token": "seu_token_aqui" }
```
