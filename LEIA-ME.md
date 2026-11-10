# Multiverso RPG · Edição Quatro Histórias

Esta versão separa o RPG em **4 campanhas independentes**. O anfitrião **escolhe primeiro a história** e **depois escolhe a quantidade de vagas**. Os convidados recebem automaticamente o universo definido para a sala.

## Campanhas disponíveis

- **Jujutsu Kaisen | A maldição de Tóquio:** Escola sob o Véu, Estação de Shibuya e O Ritual do Selo. Feiticeiros, maldições, talismãs e barreiras.
- **Tokyo Ghoul | Sombras do Distrito 20:** Café Anteiku, Operação no Distrito e A Noite das Máscaras. Ghouls, CCG, kagune, máscaras e escolhas morais.
- **Dragon Ball | A jornada das sete esferas:** O Radar das Esferas, Treino na Torre e A Última Esfera. Ki, torneios, treinamento e Esferas do Dragão.
- **Demon Slayer | O juramento da Nichirin:** Seleção Final, O Trem da Madrugada e A Fortaleza ao Anoitecer. Oni, Respirações, glicínias e espadas Nichirin.

Cada campanha tem **3 capítulos, 9 cenas narrativas com duas escolhas, inimigos comuns, combates, itens e três chefes**. Os personagens possuem classes disponíveis de acordo com o universo escolhido. São aventuras **originais inspiradas nos conceitos dos universos**, não reproduções de episódios completos.

## Estrutura do pacote

```text
worker.js
wrangler.jsonc
public/
  index.html
  avatars/
    01.png ... 10.png
  art/
    home-splash.png
    home-portal.png
    event-chest.png
    event-merchant.png
    event-camp.png
    enemy-spirit.png
    enemy-demon-purple.png
    enemy-demon-violet.png
    enemy-elite.png
    enemy-boss.png
    ending-crown.png
LEIA-ME.md
```


## Atualização visual desta versão

- **Nova home ilustrada** com arte principal do Multiverso RPG.
- **Eventos com imagens próprias** para portal, baú, mercador e acampamento.
- **Combates com artes novas** para inimigos comuns, elites e chefes.
- **Tela final melhorada** com imagem de coroa mágica.
- **Nova pasta `public/art`** adicionada ao projeto para armazenar os assets da interface.

## Publicar no GitHub / Cloudflare Workers & Pages

1. Faça backup dos arquivos que já estão publicados.
2. Extraia o ZIP e copie os arquivos da pasta principal diretamente para a **raiz do repositório** conectado à Cloudflare, substituindo os anteriores.
3. Preserve as pastas `public/avatars` e `public/art`, porque elas contêm os retratos e as novas artes do jogo.
4. Use o deploy automático do GitHub ou `npx wrangler deploy` no diretório do projeto.
5. Teste duas sessões em navegadores ou celulares diferentes: crie uma sala, escolha **Dragon Ball**, defina vagas e entre com outro aparelho; confirme se os dois veem Dragon Ball.
6. Abra outra sala com outro universo para conferir que as campanhas não se misturam.

## Observações técnicas

- O anfitrião conduz a simulação. Os convidados enviam comandos ao servidor por meio de uma sala Cloudflare Durable Object.
- Ao criar uma sala, o servidor grava também o identificador da campanha. A resposta de entrada retorna esse identificador aos convidados.
- O anfitrião pode escolher quantos jogadores entram, sem limite fixo de 4. O desempenho real depende dos aparelhos, da conexão e da Cloudflare.
- Se começar a partida com vagas vazias, a criação de personagens considerará **os participantes conectados no momento do início**. Evite entradas tardias após o começo.
- O progresso local grava qual campanha estava sendo jogada; partidas antigas sem identificação de campanha podem iniciar como Jujutsu Kaisen ao continuar.
- Use os universos, personagens e imagens apenas conforme os direitos/licenças aplicáveis. Este é um projeto de fã não oficial.

## Referências de pesquisa

- Jujutsu Kaisen (site oficial): https://jujutsukaisen.jp/story/
- Tokyo Ghoul (VIZ): https://www.viz.com/tokyo-ghoul
- Tokyo Ghoul (glossário oficial): https://www.marv.jp/special/tokyoghoul/first/glossary.html
- Dragon Ball (site oficial): https://en.dragon-ball-official.com/news/01_3850.html
- Demon Slayer (Aniplex): https://www.aniplex.co.jp/lineup/kimetsu_anime/story/

## Testes realizados

- Verificação de sintaxe de `worker.js` e do script JavaScript de `index.html`.
- Verificação por execução em ambiente JavaScript das quatro configurações de campanha e seus 3 capítulos.
- Simulação lógica da progressão até o encerramento da terceira missão de cada campanha.
- Simulação da criação de uma sala e da entrada de um convidado, validando o retorno da campanha gravada no servidor.

**Ainda não foi possível validar visualmente em um navegador real nem concluir um teste multiplayer completo com dois dispositivos. Faça esses testes antes de publicar para todos.**
