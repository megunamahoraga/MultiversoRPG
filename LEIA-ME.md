# Multiverso RPG Online (Cloudflare)

Arquivos (mantenha esta estrutura na raiz do repositório do GitHub):
- worker.js
- wrangler.jsonc
- public/index.html

## Publicar
1. No GitHub, crie um repositório novo e envie os 3 arquivos (para criar a pasta, ao nomear o arquivo digite public/index.html).
2. No Cloudflare: Workers & Pages > Create > Import a repository (Git) > escolha o repositório.
3. Deixe o build command vazio e o deploy command como "npx wrangler deploy". Clique em Deploy.
4. O link termina em .workers.dev. Abra e clique em "Criar sala online".

## Como jogar
O anfitrião cria a sala e manda o link ou o código para os amigos. Quando todos entrarem, o anfitrião clica em "Começar a aventura".
O anfitrião precisa manter a aba aberta durante o jogo.
