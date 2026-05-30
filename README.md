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
