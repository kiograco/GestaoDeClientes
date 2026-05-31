# NCProgrammers CRM

Plataforma de atendimento multicanal com gestão de contatos, tickets, filas,
usuários, campanhas e chatbot configurável.

## Recursos

- Atendimento por WhatsApp, Telegram, Instagram e Messenger.
- Múltiplos usuários e empresas.
- Envio e recebimento de mensagens e mídias.
- Gestão de contatos, filas e etiquetas.
- Chatbot visual com roteamento por etapas.
- Campanhas, relatórios e integrações por API.

## Documentação

- [Manual de uso para onboarding](docs/MANUAL_DE_USO.md)

## Execução local

### Requisitos

- Docker Desktop com Docker Compose.
- Node.js 20 para executar o frontend em desenvolvimento.

### Backend

Crie `backend/.env` a partir das variáveis necessárias para o ambiente e execute:

```powershell
cd backend
docker compose up -d --build
```

A API estará disponível em `http://localhost:3100`.

### Frontend

Crie `frontend/.env` com a URL da API e execute:

```powershell
cd frontend
$env:NODE_OPTIONS = "--openssl-legacy-provider"
npm install
npx quasar dev
```

A interface estará disponível em `http://localhost:8080`.

## Seguranca

- Use segredos aleatorios exclusivos para `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `POSTGRES_PASSWORD` e credenciais do RabbitMQ.
- Mantenha `backend/.env` fora do Git. Use `backend/.env.example` somente como
  referencia.
- Em producao, publique apenas a API por meio de proxy reverso HTTPS. PostgreSQL,
  Redis e RabbitMQ devem permanecer em rede privada.
- Renove tokens da API externa apos atualizacoes de seguranca ou suspeita de
  vazamento.

## Backups

O backup PostgreSQL e salvo em `backend/.data/backups`, que permanece fora do
Git. Para gerar um dump compactado e remover dumps locais com mais de 14 dias:

```powershell
cd backend
.\scripts\backup-postgres.ps1
```

Para restaurar um dump, pare o uso da aplicacao e confirme explicitamente a
substituicao dos dados:

```powershell
cd backend
.\scripts\restore-postgres.ps1 -BackupFile .\.data\backups\ncprogrammers-AAAAMMDD-HHMMSS.dump -ConfirmRestore
```

Agende `backup-postgres.ps1` diariamente e copie os dumps para armazenamento
externo criptografado. Teste a restauracao periodicamente em um ambiente
separado.

## Instagram Oficial

O canal `Instagram Oficial` usa OAuth e a API oficial da Meta. Senhas da conta
do Instagram nao sao armazenadas. A integracao aceita contas profissionais
Business ou Creator.

No painel Meta for Developers:

1. Adicione o produto Instagram com Instagram Login ao aplicativo.
2. Cadastre `INSTAGRAM_REDIRECT_URI` como OAuth Redirect URI valido.
3. Cadastre `https://api.example.com/instagram/webhook` como Callback URL do
   webhook e use o mesmo valor de `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`.
4. Assine os campos `messages`, `messaging_postbacks` e `messaging_seen`.
5. Solicite acesso aos escopos `instagram_business_basic` e
   `instagram_business_manage_messages`.

Configure as variaveis `INSTAGRAM_*` conforme `backend/.env.example`. O callback
e o webhook precisam ser publicados por HTTPS para uso fora do ambiente local.

## Avisos

Alguns canais utilizam bibliotecas não oficiais para comunicação com serviços
externos. O uso pode estar sujeito a bloqueios, limitações ou alterações dos
provedores. Avalie os riscos antes de utilizar em produção.

Este projeto não é afiliado, autorizado ou endossado por WhatsApp, Instagram,
Telegram, Facebook ou seus respectivos proprietários.

## Licença E Origem

NCProgrammers CRM é uma distribuição modificada de um projeto originalmente
publicado como Izing. A nova identidade visual, documentação e alterações
específicas desta distribuição são mantidas pela NCProgrammers.

O código permanece licenciado sob
[GNU Affero General Public License v3.0 ou posterior](https://www.gnu.org/licenses/agpl-3.0.pt-br.html).
Ao disponibilizar uma versão modificada como serviço, publique também o código
fonte correspondente conforme os termos da AGPL.

Consulte o histórico Git e o arquivo `CHANGELOG.md` para rastrear a evolução da
base original e das alterações posteriores.
