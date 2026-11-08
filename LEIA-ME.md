# Multiverso RPG | Edição Eclipse 3.0

Atualização visual feita sobre a versão anterior do jogo (com 10 avatares, seleção com confirmação, classes existentes e salas configuráveis).

## O que mudou

- Nova identidade visual "Crônicas do Véu" e tela inicial cinematográfica.
- Cores, tipografia, fundo, cartões, botões, inputs e contraste reorganizados.
- Cards de participantes com retrato, classe e atributos mais legíveis.
- Barras de vida e exibição das batalhas mais consistentes.
- Seleção de 10 avatares em grade adaptada a desktop e mobile, com visualização de corpo inteiro, destaque e confirmação.
- Mantido o sistema original de classes, profissões, itens, progressão e multiplayer.

## Arquivos

- `public/index.html`: interface e regras do jogo
- `public/avatars/`: retratos dos 10 personagens
- `worker.js`: servidor das salas online
- `wrangler.jsonc`: configuração de implantação

## Publicação no GitHub + Cloudflare

1. Extraia o ZIP. Abra a pasta `multiverso-rpg-atualizado`.
2. Substitua os arquivos correspondentes no **mesmo local** do repositório GitHub conectado ao Cloudflare Workers.
3. Preserve a estrutura `public/avatars/` e não mova `public/index.html` para a raiz.
4. Aguarde o deploy automático ou use o processo de implantação que você já utiliza.
5. Faça um teste de uma sala com pelo menos dois dispositivos.

## Validação realizada

- Sintaxe do JavaScript verificada.
- Fluxo local verificado em navegador simulado para desktop (1280px) e celular (390px): menu, dificuldade, classe, profissão, 10 avatares, confirmação e início da aventura.
- Sem erros JavaScript ou rolagem horizontal nos dois tamanhos testados.
- Não foi feito teste multiplayer real com Cloudflare em produção.

**Observação:** Imagens de personagens inspiradas em obras conhecidas foram fornecidas pelo usuário. Para uso comercial/público, verifique os direitos de uso dessas imagens.
