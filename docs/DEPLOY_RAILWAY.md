# Publicação de demonstração com Railway e Vercel

Este guia publica o backend do NCProgrammers CRM no Railway Trial e o frontend estático no Vercel.

O plano Trial do Railway permite no máximo **3 volumes por projeto**. A arquitetura abaixo respeita esse limite.

## 1. Arquitetura

Crie quatro serviços no Railway:

| Serviço | Origem | Volume persistente | Acesso público |
| --- | --- | --- | --- |
| `Postgres` | Template PostgreSQL | Automático | Não |
| `Redis` | Template Redis | Automático | Não |
| `rabbitmq` | Imagem `rabbitmq:3-management` | Não | Não |
| `backend-api` | Repositório Git, diretório `/backend` | `/app/data` | Sim |

Crie um projeto separado no Vercel:

| Projeto | Origem | Acesso público |
| --- | --- | --- |
| `frontend` | Repositório Git, diretório `frontend` | Sim |

Os três volumes permitidos no Railway serão usados por PostgreSQL, Redis e backend. Não adicione volume ao RabbitMQ durante a demonstração.

## 2. Preparação

Antes de começar:

- confirme que as alterações mais recentes estão no GitHub;
- gere duas chaves aleatórias longas para JWT;
- escolha a mesma região para todos os serviços Railway;
- utilize um número de teste para demonstrar WhatsApp;
- não publique senhas ou tokens no Git.

## 3. Criar projeto no Railway

1. Acesse [railway.com/new](https://railway.com/new).
2. Clique em **Empty Project**.
3. Informe:

```text
ncprogrammers-crm-demo
```

## 4. Criar PostgreSQL

1. No canvas, clique em **+ Create**.
2. Selecione **Database > PostgreSQL**.
3. Aguarde a criação.
4. Confirme se o serviço se chama `Postgres`. Renomeie-o se necessário.

O template adiciona o primeiro volume automaticamente. Não gere domínio público nem TCP Proxy.

## 5. Criar Redis

1. Clique em **+ Create**.
2. Selecione **Database > Redis**.
3. Aguarde a criação.
4. Confirme se o serviço se chama `Redis`. Renomeie-o se necessário.

O template adiciona o segundo volume automaticamente. Não gere domínio público nem TCP Proxy.

## 6. Criar RabbitMQ sem volume

1. Clique em **+ Create > Docker Image**.
2. Informe:

```text
rabbitmq:3-management
```

3. Renomeie o serviço para:

```text
rabbitmq
```

4. Abra **Variables > RAW Editor**.
5. Cole:

```env
RABBITMQ_DEFAULT_USER=crm
RABBITMQ_DEFAULT_PASS=SUBSTITUA_POR_UMA_SENHA_ALFANUMERICA_LONGA
```

6. Confirme as alterações.

Não adicione volume nem domínio público ao RabbitMQ. Use somente letras e números na senha.

Sem volume, o RabbitMQ pode perder filas internas transitórias após reinícios. Isso é aceitável apenas para demonstração.

## 7. Criar backend no Railway

### 7.1 Conectar repositório

1. Clique em **+ Create > GitHub Repo**.
2. Escolha o repositório do CRM.
3. Renomeie o serviço para:

```text
backend-api
```

4. Abra **Settings**.
5. Em **Source**, defina **Root Directory**:

```text
/backend
```

O Railway utilizará `backend/Dockerfile`.

### 7.2 Gerar domínio da API

1. Acesse **Settings > Networking > Public Networking**.
2. Clique em **Generate Domain**.
3. Copie a URL HTTPS gerada, sem barra no final.

Exemplo:

```text
https://backend-api-production-abcd.up.railway.app
```

Nas próximas etapas, substitua `URL_DA_API` pela sua URL.

### 7.3 Adicionar terceiro volume

1. Acesse **Settings > Volumes**.
2. Clique em **Add Volume**.
3. Informe:

```text
/app/data
```

Esse é o terceiro e último volume do Railway Trial. Ele preserva sessões do WhatsApp e mídias enviadas.

### 7.4 Configurar variáveis

1. Acesse **Variables > RAW Editor**.
2. Cole o bloco abaixo.
3. Substitua `URL_DA_API`, segredos e senhas.

```env
NODE_ENV=production
PORT=3100
BACKEND_URL=URL_DA_API
PROXY_PORT=443
FRONTEND_URL=https://frontend-pendente.vercel.app
PERSISTENT_DATA_DIR=/app/data

JWT_SECRET=SUBSTITUA_POR_UMA_CHAVE_ALEATORIA_LONGA
JWT_REFRESH_SECRET=SUBSTITUA_POR_OUTRA_CHAVE_ALEATORIA_LONGA
SUPERADMIN_EMAIL=SEU_EMAIL_DE_ADMINISTRACAO
SUPERADMIN_PASSWORD=SUBSTITUA_POR_UMA_SENHA_FORTE

RESEND_API_KEY=SUBSTITUA_PELA_CHAVE_RESEND
RESEND_FROM_EMAIL=contato@SEU_DOMINIO_VALIDADO

POSTGRES_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
POSTGRES_DB=${{Postgres.PGDATABASE}}
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}

IO_REDIS_SERVER=${{Redis.REDISHOST}}
IO_REDIS_PORT=${{Redis.REDISPORT}}
IO_REDIS_USERNAME=
IO_REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
IO_REDIS_DB_SESSION=9

RABBITMQ_DEFAULT_USER=${{rabbitmq.RABBITMQ_DEFAULT_USER}}
RABBITMQ_DEFAULT_PASS=${{rabbitmq.RABBITMQ_DEFAULT_PASS}}
AMQP_URL=amqp://${{rabbitmq.RABBITMQ_DEFAULT_USER}}:${{rabbitmq.RABBITMQ_DEFAULT_PASS}}@${{rabbitmq.RAILWAY_PRIVATE_DOMAIN}}:5672?connection_attempts=5&retry_delay=5

USER_LIMIT=10
CONNECTIONS_LIMIT=5
MIN_SLEEP_INTERVAL=500
MAX_SLEEP_INTERVAL=2000
CHROME_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage
RAILWAY_SHM_SIZE_BYTES=536870912
```

Mantenha temporariamente:

```env
FRONTEND_URL=https://frontend-pendente.vercel.app
```

O valor correto será inserido após criar o projeto no Vercel. Mantenha `PROXY_PORT=443`, pois o código atual inclui essa porta nas URLs públicas de mídia.

### 7.5 Implantar backend

1. Confirme as alterações.
2. Abra **Deployments**.
3. Aguarde o deploy.
4. Verifique os logs.
5. Confirme uma linha semelhante a:

```text
Web server listening at: http://0.0.0.0:3100/
```

O backend executa migrations automaticamente ao iniciar.

## 8. Criar frontend no Vercel

### 8.1 Importar repositório

1. Acesse [vercel.com/new](https://vercel.com/new).
2. Clique em **Import** no repositório do CRM.
3. Informe um nome, por exemplo:

```text
ncprogrammers-crm-demo
```

4. Em **Root Directory**, clique em **Edit**.
5. Selecione:

```text
frontend
```

### 8.2 Configurar build

O arquivo `frontend/vercel.json` define:

```json
{
  "buildCommand": "NODE_OPTIONS=--openssl-legacy-provider npx quasar build",
  "outputDirectory": "dist/spa"
}
```

No painel do Vercel, confirme:

| Campo | Valor |
| --- | --- |
| Framework Preset | `Other` |
| Root Directory | `frontend` |
| Build Command | `NODE_OPTIONS=--openssl-legacy-provider npx quasar build` |
| Output Directory | `dist/spa` |
| Install Command | `npm install` ou automático |

### 8.3 Configurar variável de ambiente

1. Antes do deploy, abra **Environment Variables**.
2. Adicione:

```env
VUE_URL_API=URL_DA_API
```

3. Marque **Production**, **Preview** e **Development**.
4. Opcionalmente adicione:

```env
VUE_FACEBOOK_APP_ID=
```

Não inclua aspas na URL.

### 8.4 Implantar

1. Clique em **Deploy**.
2. Aguarde a compilação.
3. Abra a URL gerada.

Exemplo:

```text
https://ncprogrammers-crm-demo.vercel.app
```

Nas próximas etapas, substitua `URL_DO_FRONTEND` pela sua URL.

## 9. Atualizar CORS no Railway

1. Volte ao serviço `backend-api`.
2. Acesse **Variables**.
3. Atualize:

```env
FRONTEND_URL=URL_DO_FRONTEND
```

4. Confirme as alterações.
5. Aguarde o redeploy automático do backend.

## 10. Carregar dados iniciais

Execute esta etapa somente uma vez em um banco novo.

### 10.1 Instalar Railway CLI

No terminal local:

```powershell
npm install -g @railway/cli
railway login
```

### 10.2 Vincular projeto

Na raiz do repositório:

```powershell
railway link
```

Escolha o projeto Railway, o ambiente `production` e o serviço `backend-api`.

### 10.3 Executar seeds

Abra um shell no container:

```powershell
railway ssh -s backend-api
```

Dentro do container:

```sh
npx sequelize db:seed:all
exit
```

Não execute `db:seed:all` novamente no mesmo banco. Os seeds não são idempotentes.

## 11. Primeiro acesso

1. Abra:

```text
URL_DO_FRONTEND/#/login
```

2. Entre com:

```text
Usuário: admin@ncprogrammers.local
Senha temporária: 123456
```

3. Abra **Perfil**.
4. Altere imediatamente e-mail e senha.

### 11.1 Acesso do superadministrador

O backend cria a conta global na inicialização quando `SUPERADMIN_EMAIL` e
`SUPERADMIN_PASSWORD` estão configurados e já existe ao menos uma empresa no
banco. Essa conta acessa o painel de empresas após o login e pode liberar ou
suspender o uso do sistema para cada cliente.

Use uma senha exclusiva e não compartilhe essa conta com administradores das
empresas clientes.

## 12. Validar WhatsApp

1. Entre como administrador.
2. Abra **Canais**.
3. Cadastre ou edite um canal **WhatsApp**.
4. Clique em **Novo QR Code**.
5. Leia o QR Code com um número de teste.
6. Aguarde **Conectado**.
7. Reinicie `backend-api` pelo Railway.
8. Confirme se o canal reconecta sem solicitar outro QR Code.

Esse teste valida o volume `/app/data`.

## 13. Limitação do RabbitMQ no Trial

No Trial, o RabbitMQ fica sem volume:

- ele funciona enquanto o serviço estiver ativo;
- reinícios podem descartar filas internas pendentes;
- evite reiniciar esse serviço durante a demonstração;
- não use essa configuração em produção.

Ao migrar para Hobby:

1. abra `rabbitmq`;
2. acesse **Settings > Volumes**;
3. clique em **Add Volume**;
4. use:

```text
/var/lib/rabbitmq
```

## 14. Instagram Oficial opcional

Adicione em `backend-api`:

```env
INSTAGRAM_APP_ID=ID_DO_APP_META
INSTAGRAM_APP_SECRET=SEGREDO_DO_APP_META
INSTAGRAM_REDIRECT_URI=URL_DA_API/instagram/oauth/callback
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=TOKEN_ALEATORIO
INSTAGRAM_GRAPH_URL=https://graph.instagram.com
```

No painel Meta for Developers:

1. cadastre `INSTAGRAM_REDIRECT_URI` como URI OAuth válida;
2. use `URL_DA_API/instagram/webhook` como callback;
3. informe o mesmo `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`;
4. assine `messages`, `messaging_postbacks` e `messaging_seen`.

## 15. Checklist final

- [ ] Railway possui `Postgres`, `Redis`, `rabbitmq` e `backend-api`.
- [ ] Railway possui exatamente três volumes: PostgreSQL, Redis e backend.
- [ ] RabbitMQ está ativo sem volume.
- [ ] `backend-api` responde pelo domínio HTTPS do Railway.
- [ ] Frontend abre pela URL HTTPS do Vercel.
- [ ] `FRONTEND_URL` no Railway corresponde à URL do Vercel.
- [ ] `VUE_URL_API` no Vercel corresponde à URL da API Railway.
- [ ] Login administrativo funciona.
- [ ] Navegador não exibe erro de CORS.
- [ ] Upload e download de mídia funcionam.
- [ ] WebSocket recebe novas mensagens.
- [ ] WhatsApp reconecta após reinício do backend.
- [ ] Segredos reais não foram commitados no Git.

## 16. Diagnóstico rápido

### Railway bloqueia criação de volume

Mensagem:

```text
You can only have 3 volumes per project
```

Confirme se os volumes estão restritos a PostgreSQL, Redis e `backend-api`. Não crie volume para RabbitMQ.

### Build falha no Vercel

Confirme:

```text
Root Directory: frontend
Build Command: NODE_OPTIONS=--openssl-legacy-provider npx quasar build
Output Directory: dist/spa
```

### Frontend abre, mas login falha

Confirme:

```env
VUE_URL_API=URL_DA_API
FRONTEND_URL=URL_DO_FRONTEND
```

Depois faça redeploy no Vercel e no Railway.

### PostgreSQL não conecta

Confirme os nomes dos serviços e as referências `${{Postgres.*}}`.

### Redis não conecta

Confirme `${{Redis.REDISHOST}}`, `${{Redis.REDISPORT}}` e `${{Redis.REDISPASSWORD}}`.

### RabbitMQ não conecta

Confirme o nome `rabbitmq` e o host `${{rabbitmq.RAILWAY_PRIVATE_DOMAIN}}:5672`.

### Mídias retornam erro

Confirme:

```env
BACKEND_URL=URL_DA_API
PROXY_PORT=443
PERSISTENT_DATA_DIR=/app/data
```

### WhatsApp solicita QR Code após redeploy

Confirme se o volume do `backend-api` está montado em `/app/data`.

## 17. Antes de produção

Antes de uso comercial:

- migre o Railway para Hobby ou Pro;
- adicione volume ao RabbitMQ;
- configure backups;
- use domínio próprio;
- monitore CPU e memória do Chrome usado pelo WhatsApp;
- mantenha PostgreSQL, Redis e RabbitMQ sem exposição pública;
- avalie VPS ou infraestrutura dedicada para maior previsibilidade;
- trate bibliotecas não oficiais como componentes sujeitos a bloqueios e alterações dos provedores.
