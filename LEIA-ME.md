# Multiverso RPG Online · Edição Expedições

## Arquivos
- `worker.js`
- `wrangler.jsonc`
- `public/index.html`

## Publicação na Cloudflare Workers
1. Atualize esses arquivos no repositório GitHub conectado à Cloudflare, preservando a pasta `public`.
2. No painel Cloudflare, confira o projeto Workers & Pages vinculado ao repositório.
3. Faça o deploy com `npx wrangler deploy` (ou deixe a integração Git realizar o deploy automático).
4. Abra a URL do Worker e escolha **Criar sala online**.

## Como jogar
O anfitrião escolhe o número de vagas, cria a sala e compartilha o código ou link. Cada participante entra em seu próprio dispositivo. O anfitrião mantém sua aba aberta para conduzir a partida. O modo no mesmo aparelho também aceita quantidade personalizada.

## Observações
- Não existe mais um limite fixo de quatro participantes. Na prática, capacidade e desempenho dependem dos recursos da plataforma e dos aparelhos.
- O anfitrião controla a simulação; os convidados enviam suas escolhas ao servidor.
- Para salas novas, o limite escolhido é aplicado pelo servidor. Uma sala já criada não tem seu limite alterado.
- Faça backup do projeto atual antes de publicar esta versão.
