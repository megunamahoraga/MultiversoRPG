# Multiverso RPG Online · Edição Personagens & Interface

## Arquivos
- `worker.js`
- `wrangler.jsonc`
- `public/index.html`
- `public/avatars/` (10 retratos usados na seleção de personagens)

## O que foi atualizado
- **Salas com capacidade personalizada**: o anfitrião escolhe quantos participantes entram.
- **Interface refeita**: visual mais bonito, com HUD em cards, retratos e destaque para o jogador da vez.
- **10 personagens para escolher no início**: cada jogador escolhe seu retrato antes da aventura começar.
- **Retratos no lugar de J1 / J2 / J3...**: durante a partida, os jogadores aparecem com suas imagens na interface.
- **Multiplayer preservado**: funciona tanto no modo local quanto na sala online.
- **Novas classes mantidas**: Majin Saiyajin, Meio-Humano, Humano e Meio-Ghoul continuam disponíveis.

## Como publicar na Cloudflare Workers & Pages
1. Extraia o ZIP.
2. Substitua os arquivos do seu repositório GitHub conectado à Cloudflare.
3. Preserve a estrutura da pasta `public`, incluindo a pasta `public/avatars`.
4. Faça o deploy automático pelo GitHub ou rode `npx wrangler deploy`.
5. Abra o jogo e teste uma sala online antes de liberar para todo mundo.

## Como jogar
1. O anfitrião cria a sala e define quantas vagas estarão disponíveis.
2. Os convidados entram pelo código ou link da sala.
3. Cada jogador escolhe:
   - classe;
   - profissão;
   - um dos 10 personagens.
4. Depois disso, a aventura começa normalmente.

## Observações
- Não existe mais limite fixo de 4 jogadores no código.
- Na prática, salas muito grandes podem depender do desempenho do navegador e da conexão.
- O anfitrião continua sendo quem mantém a sessão ativa no modo online.
- Se quiser alterar novamente retratos, textos ou balanceamento, você pode editar só o `public/index.html` e a pasta `public/avatars`.
