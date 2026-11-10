# Multiverso RPG · Edição Portal Seguro 5.1 (revisada)

Esta versão corrige problemas da edição 5.0. Consulte `ATUALIZACOES-v5.1.md` para os detalhes.

Esta versão tem **cadastro real de jogadores, login, aprovação manual pelo administrador, bloqueio de contas e painel administrativo protegido por senha**. As quatro campanhas, os avatares WebP, a pasta `public/arts` e as salas multiplayer foram preservadas.

> **ATENÇÃO: configuração obrigatória antes de publicar.** O jogo não funcionará corretamente até você criar o banco D1 e definir sua senha administrativa na Cloudflare. Não existe senha padrão no código. Não coloque sua senha em `index.html`, `worker.js` ou no GitHub.

## Instalação (Cloudflare Workers + GitHub)

O projeto já tem `worker.js`, `public/index.html`, `wrangler.jsonc` e `migrations/0001_auth.sql`.

### 1. Criar banco D1

Abra o terminal na raiz do projeto, com Node.js instalado e sua conta Cloudflare conectada:

```bash
npx wrangler login
npx wrangler d1 create multiverso-rpg-users
```

O comando devolve um `database_id`. Abra `wrangler.jsonc` e substitua **`COLE_AQUI_O_ID_DO_SEU_D1`** pelo ID retornado. **Deixe o binding exatamente como `DB`.**

### 2. Criar as tabelas

```bash
npx wrangler d1 migrations apply multiverso-rpg-users --remote
```

Isso cria tabelas `users`, `sessions`, `auth_limits` e `settings`. Sem este passo, o login não funcionará.

### 3. Configurar a senha de administrador

Crie uma senha forte, exclusiva, com ao menos 12 caracteres. Defina-a como **segredo privado** do Worker, nunca como variável pública ou arquivo do GitHub:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

O terminal solicitará a senha sem exibi-la. Se você publica diretamente pela interface Cloudflare, configure o segredo `ADMIN_PASSWORD` em **Workers & Pages → seu Worker → Settings → Variables and Secrets** (tipo **Secret**, não texto público). Certifique-se de que o banco D1 `DB` está vinculado ao **mesmo Worker publicado**.

### 4. Publicar

Envie os arquivos para o GitHub conectado ao Cloudflare e confira se `wrangler.jsonc` tem o ID correto e se o deploy mantém os bindings `DB` e `ROOM`. Se usar o terminal:

```bash
npx wrangler deploy
```

Acesse o domínio do seu jogo e clique em **Cadastrar** para criar uma conta de jogador. O cadastro ficará `Pendente`. Clique em **Área administrativa**, digite sua senha e **Aprovar** para liberar o jogador. Somente depois de aprovado o usuário poderá fazer login e jogar.

## Recursos incluídos

- **Cadastro**: usuário, e-mail e senha. Novas contas começam sempre como `Pendente`.
- **Login**: usuário/e-mail e senha. Apenas contas aprovadas podem entrar.
- **Admin**: acesso por senha secreta, lista de usuários, busca, aprovar, recusar, bloquear e liberar.
- **Segurança**: PBKDF2-SHA256 com salt aleatório, sessão aleatória em cookie `HttpOnly; SameSite=Strict; Secure` no HTTPS, credenciais checadas no Worker, bloqueio imediato de sessões ao recusar/bloquear, limitação básica de tentativas, proteção de origem em POST.
- **Salas online**: somente usuários aprovados podem criar/entrar/interagir. Cada sala vincula a posição ao usuário autenticado. A pessoa que criou a sala continua sendo o anfitrião.
- **Privacidade local**: progresso do jogo é separado por nome de conta no armazenamento do navegador.
- **Inscrições**: o administrador pode suspender novos cadastros.

## Observações e limites

- **Não há envio de e-mails**, validação de e-mail nem recuperação automática de senhas nesta versão. O formulário é um pedido de acesso, não prova que o usuário é dono do e-mail informado.
- O administrador usa a senha configurada no segredo `ADMIN_PASSWORD` na Cloudflare. Para trocá-la, atualize o segredo no painel Cloudflare. Não há mudança de senha do admin na interface.
- Não há senha inicial nem conta admin padrão: isso evita que alguém descubra uma credencial embutida no site.
- A administração **não é uma proteção baseada só em JavaScript**: todas as ações e permissões importantes são verificadas no servidor e no banco D1.
- Salas antigas abertas antes desta atualização não possuem os vínculos de contas e **devem ser recriadas** após a publicação.
- Configure o binding D1 e migração antes da primeira implantação. É recomendável testar duas contas e dois celulares antes de anunciar a nova versão.
- Para continuar usando sua estrutura atual, mantenha `public/avatars/*.webp` e `public/arts/*` com esses nomes.
- O limite de sala do servidor é **100 vagas** para evitar cargas extremas; ainda assim, salas grandes precisam de testes de desempenho.

## Arquivos principais

- `worker.js` — API de autenticação, moderação e controle de acesso às salas
- `migrations/0001_auth.sql` — estrutura do banco D1
- `wrangler.jsonc` — configurações e bindings Cloudflare
- `public/index.html` — tela de login/cadastro, painel administrativo e jogo
- `public/avatars` — retratos em WebP
- `public/arts` — imagens 3D das cenas e batalhas


**Nota de segurança:** a sessão de administrador expira em 8 horas. Se você mudar o segredo `ADMIN_PASSWORD`, as sessões administrativas anteriores perdem o acesso.
