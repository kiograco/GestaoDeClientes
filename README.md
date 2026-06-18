# NCProgrammers CRM

Plataforma de atendimento multicanal com gestão de contatos, tickets, filas,
usuários, campanhas e chatbot configurável.

## Recursos

- Ordens de servico com agenda, recorrencia, documentos em PDF, produtos e
  tipos de servico vinculados.
- Controle de estoque para servicos, com baixa automatica, movimentos,
  alertas de estoque minimo e ajuste manual auditado.
- Atendimento por WhatsApp, Telegram, Instagram e Messenger.
- Múltiplos usuários e empresas.
- Envio e recebimento de mensagens e mídias.
- Gestão de contatos, filas e etiquetas.
- Chatbot visual com roteamento por etapas.
- Campanhas, relatórios e integrações por API.
- Identidade visual por empresa com logo configurável.
- Recuperação de senha por e-mail.
- Painel global de superadministrador para gestão comercial das empresas.
- Assinaturas pagas via Asaas com Pix, página hospedada para cartão e webhook.

## Documentação

- [Manual de uso para onboarding](docs/MANUAL_DE_USO.md)
- [Publicação de demonstração com Railway e Vercel](docs/DEPLOY_RAILWAY.md)

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

As migrations são executadas automaticamente na inicialização do container. Para
executá-las manualmente fora do Docker:

```powershell
cd backend
npm run db:migrate
```

### Frontend

Crie `frontend/.env` com a URL da API e execute:

```powershell
cd frontend
$env:NODE_OPTIONS = "--openssl-legacy-provider"
npm install
npx quasar dev
```

A interface estará disponível em `http://localhost:8080`.

## Administração SaaS

Configure no backend:

```env
SUPERADMIN_EMAIL=owner@example.com
SUPERADMIN_PASSWORD=SUBSTITUA_POR_UMA_SENHA_FORTE
```

Na inicialização, o backend garante a existência da conta global de
superadministrador quando já existe ao menos uma empresa cadastrada. Essa conta
é direcionada ao painel **Gestão de empresas** após o login.

O superadministrador pode:

- cadastrar empresas e seus administradores iniciais;
- editar nome da empresa, nome, e-mail e senha do administrador principal;
- definir limites de usuários e canais;
- suspender ou reativar o acesso;
- informar o prazo pago inicial;
- renovar o acesso adicionando novos dias ao saldo ainda disponível.

Administradores e atendentes visualizam no cabeçalho quantos dias de acesso
restam. Quando o prazo termina ou a empresa é suspensa, login, refresh de token,
API externa e sockets são bloqueados.

Empresas antigas sem prazo definido permanecem liberadas até que o
superadministrador faça a primeira renovação.

O painel mantém renovação manual para suporte comercial e também oferece
assinaturas automáticas via Asaas. A empresa pode abrir **Minha assinatura**,
escolher um plano, gerar Pix com QR Code e Copia e Cola ou abrir a página segura
de pagamento hospedada pelo gateway. O prazo é renovado após webhook válido e
idempotente.

## Ordens De Servico, Servicos E Estoque

O modulo de ordens de servico permite cadastrar atendentes, produtos de estoque,
tipos de servico e ordens de servico por empresa. Todas as consultas e
alteracoes usam `tenantId`, preservando o isolamento multiempresa.

Recursos disponiveis:

- cadastro de produtos de estoque com nome, SKU, unidade, quantidade, estoque
  minimo, custo, preco de venda e status ativo;
- unidade limitada a `unidade` ou `litros`;
- quantidade e estoque minimo tratados como numeros inteiros;
- valores monetarios tratados no padrao BRL, com centavos fixos;
- cadastro de tipos de servico com preco padrao;
- insercao de produtos e tipos de servico diretamente dentro da ordem de
  servico;
- calculo de totais por item e total geral da OS;
- baixa automatica de produtos quando a OS e concluida;
- bloqueio de conclusao quando nao ha saldo suficiente;
- historico de movimentos de estoque;
- filtro e indicador de baixo estoque;
- ajuste manual de estoque por entrada, saida ou definicao de saldo;
- dashboard com valores e rankings de servicos/produtos;
- documento PDF publico e interno da OS.

Quando uma ordem e concluida, a baixa de estoque e feita uma unica vez. Se a OS
for salva novamente como concluida, o estoque nao e descontado novamente. Em caso
de saldo insuficiente, a API retorna uma mensagem operacional com produto, saldo
atual e quantidade necessaria.

## Perfis E Permissoes

Perfis de usuario por empresa:

- `admin`: administra usuarios, configuracoes e operacao da empresa.
- `supervisor`: pode gerenciar operacao e estoque.
- `atendente`: opera atendimentos e ordens dentro das regras do sistema.
- `tecnico`: perfil operacional para execucao de servicos.
- `user`: perfil basico.

Perfil global:

- `superadmin`: administra o SaaS e tambem tem permissao de gestor de estoque.

Permissoes de estoque:

- somente `admin`, `superadmin` e `supervisor` podem criar, editar, excluir ou
  ajustar produtos de estoque;
- a listagem de estoque, baixo estoque e movimentos permanece disponivel para
  usuarios autenticados da mesma empresa;
- alteracoes criticas gravam auditoria sem armazenar senhas, tokens ou dados
  sensiveis.

Eventos de auditoria de estoque:

- `service_inventory_created`
- `service_inventory_updated`
- `service_inventory_deleted`
- `service_inventory_adjusted`
- `service_inventory_adjust_failed`
- `service_inventory_auto_deducted`
- `service_inventory_auto_deduct_failed`

## Pagamentos Asaas

Configure somente no backend:

```env
ASAAS_API_KEY=SUBSTITUA_PELA_CHAVE_ASAAS
ASAAS_API_URL=https://api.asaas.com/v3
ASAAS_WEBHOOK_TOKEN=SUBSTITUA_POR_UM_TOKEN_ALEATORIO
ASAAS_RENEW_ON_CARD_CONFIRMED=false
ASAAS_SUSPEND_ON_REFUND=false
```

No painel Asaas, cadastre:

```text
https://backend-api-production-6a67.up.railway.app/webhooks/asaas
```

Use o mesmo token no Asaas e em `ASAAS_WEBHOOK_TOKEN`. A chave
`ASAAS_API_KEY` nunca deve ser exposta no frontend.

Regras aplicadas:

- Pix comum gera uma nova cobrança a cada renovação;
- QR Code e Pix Copia e Cola são obtidos da API do Asaas;
- Pix libera acesso somente após `PAYMENT_RECEIVED`;
- cartão utiliza página hospedada e o CRM não armazena número ou CVV;
- `PAYMENT_CONFIRMED` pode antecipar liberação do cartão quando a política
  `ASAAS_RENEW_ON_CARD_CONFIRMED=true` estiver habilitada;
- webhooks duplicados não adicionam dias duas vezes;
- eventos de atraso, estorno e chargeback permanecem registrados.

Pix Automático não está habilitado nesta versão porque requer acesso controlado
pelo Asaas.

Detalhes de deploy e teste estão em
[Publicação com Railway e Vercel](docs/DEPLOY_RAILWAY.md#18-configurar-pagamentos-asaas).

## Identidade Visual

Administradores de empresas podem enviar sua logo em **Configurações >
Identidade visual**. A imagem aparece no cabeçalho e na tela de login após o
cliente informar o e-mail.

Em produção, configure:

```env
PERSISTENT_DATA_DIR=/app/data
```

As logos ficam em `/app/data/public/logos`, junto ao volume persistente usado
para sessões do WhatsApp e mídias. Sem volume persistente, arquivos enviados
podem ser perdidos após redeploy.

## Recuperação De Senha

O login possui o fluxo **Esqueci minha senha**. O backend envia o link de
redefinição usando Resend.

Configure:

```env
RESEND_API_KEY=SUBSTITUA_PELA_CHAVE_RESEND
RESEND_FROM_EMAIL=contato@SEU_DOMINIO_VALIDADO
```

Para produção, utilize um remetente de domínio validado no Resend. O endereço
`onboarding@resend.dev` deve ser usado somente em testes compatíveis com as
restrições da conta.

## Qualidade

Execute antes de publicar:

```powershell
cd backend
npm run lint
npm run build
npm run test:migrate
npm run test:unit
npm run test:integration

cd ..\frontend
npm run lint
$env:NODE_OPTIONS = "--openssl-legacy-provider"
npx quasar build
```

O backend bloqueia warnings de lint por meio de `--max-warnings 0`. A variável
`NODE_OPTIONS` é necessária no frontend ao usar Node.js 20 com a versão atual
do Webpack presente no projeto.

Os testes backend usam o banco PostgreSQL de teste `wchats_test` em
`localhost:5432`. Antes da primeira execucao, prepare o banco:

```powershell
cd backend
npm run test:db:prepare
```

O fluxo de ordens de servico e estoque possui teste de integracao especifico:

```powershell
cd backend
npm run test:integration -- service-orders-inventory --coverage=false
```

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

## Mapa Interativo De Armadilhas

O modulo de monitoramento ja possui cadastro de tipos de armadilha, pontos,
upload de planta baixa e posicionamento sobre a planta. A tela fica em
`Monitoramento > Mapa`.

Arquivos principais:

- Backend: `backend/src/models/ClientFloorPlan.ts`,
  `backend/src/models/MonitoringPoint.ts`,
  `backend/src/models/MonitoringPointMapHistory.ts`,
  `backend/src/services/MonitoringServices/MonitoringService.ts`,
  `backend/src/controllers/MonitoringController.ts` e
  `backend/src/routes/monitoringRoutes.ts`.
- Frontend: `frontend/src/pages/monitoramento/Index.vue`,
  `frontend/src/components/monitoramento/FloorPlanTrapMap.vue` e
  `frontend/src/service/monitoramento.js`.
- Banco: `client_floor_plans`, `monitoring_points` com
  `position_x_percent`, `position_y_percent`, `marker_color`,
  `marker_icon_url`, `marker_type`, `is_positioned`, `trap_types` com
  cor/foto padrao de marcador, e
  `monitoring_point_map_history`.

Para cadastrar uma planta, acesse `Monitoramento > Mapa`, selecione cliente e
endereco, clique em `Planta` e envie um arquivo PDF, JPG, PNG ou WEBP. O upload
usa nome seguro gerado no backend e grava o arquivo em `/public/floor-plans`.

Para posicionar uma armadilha, primeiro gere pontos em `Monitoramento > Pontos`.
Depois, em `Monitoramento > Mapa`, selecione a planta e a armadilha. Clique no
ponto desejado da planta ou arraste um chip de armadilha nao posicionada para o
mapa. As coordenadas sao salvas como percentual relativo da planta.

Para mover, arraste o marcador ja posicionado. Para remover somente a posicao no
mapa, clique no marcador e use `Remover do mapa`; o ponto continua cadastrado e
a mudanca fica registrada no historico de mapa. A cor, a foto e o visual padrao
do marcador sao definidos no cadastro do tipo em `Monitoramento > Tipos de
Armadilhas`, e os pontos gerados herdam esse visual.

Para reutilizar em Ordem de Servico, Relatorio de Monitoramento, Relatorio
Tecnico, Certificado ou PDF de inspecao, consulte:

- `GET /monitoring/floor-plans?clientId=:id&addressId=:id` para obter a planta.
- `GET /monitoring/points?clientId=:id&addressId=:id` para obter os pontos,
  coordenadas percentuais, legenda visual e detalhes da ultima inspecao.

A exportacao deve renderizar a imagem/PDF da planta, sobrepor os marcadores com
`position_x_percent` e `position_y_percent`, exibir numero da armadilha,
legenda de cores/icones, cliente, endereco e data do relatorio.

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
