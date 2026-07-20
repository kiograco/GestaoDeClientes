# Plano de tratamento da dívida técnica pendente

Este documento cobre os itens identificados na avaliação do projeto (2026-07-20)
que foram **deliberadamente deixados de fora** da rodada de correções P0/P1/P3
(ver commits `fix(backend): corrige crash de boot e fecha lacunas de seguranca
(P0/P1)` e `fix(frontend): corrige interceptor de erro e limpa residuos da
migracao Vue3`). São mudanças de maior porte, risco ou incerteza, que merecem
revisão dedicada em vez de uma edição automatizada. Nenhum item aqui foi
executado — este é só o plano.

Ordem sugerida: dos itens de menor risco/maior valor para os de maior risco.

## 1. Rate limit nas rotas de negócio autenticadas

**Por quê:** hoje só `authRoutes`, `apiExternalRoutes`, `serviceOrderRoutes`
(e-mail) e `tenantRoutes` têm rate limit. Rotas de ticket, mensagem, contato e
campanha não têm nenhum.

**Por que não foi feito junto com o P0:** são rotas usadas por usuários
autenticados em uso normal e intenso (chat ao vivo, envio de campanha em
massa). Um limite mal calibrado quebra funcionalidade real, diferente dos
webhooks públicos (que não têm uso "legítimo" de alto volume por IP).

**Como abordar:**
1. Levantar com o time/produto os padrões reais de uso (quantas mensagens por
   minuto um atendente manda em pico, tamanho de campanha típico).
2. Aplicar `rateLimit` (já existe em `backend/src/middleware/rateLimit.ts`) por
   rota com limites generosos o suficiente para não afetar uso normal — o
   objetivo é conter abuso/bug em loop, não limitar operação legítima.
3. Testar especificamente contra o fluxo de disparo de campanha e chat ao
   vivo antes de subir para produção.

**Esforço:** pequeno a médio. **Risco:** médio (limite errado quebra produção).

## 2. Validação de entrada (Yup) ausente em controllers

**Por quê:** 16 de 43 controllers não validam o corpo da requisição
explicitamente (`TicketController`, `MessageController`, `WhatsAppController`,
`WhatsAppSessionController`, `SettingController`, `StatisticsController`,
entre outros), dependendo de validação implícita no service/model.

**Como abordar:**
1. Mapear caso a caso se já existe validação equivalente no service (nem
   todo controller sem Yup é necessariamente inseguro — pode já validar na
   camada de baixo).
2. Priorizar os controllers que recebem input diretamente de fora sem outra
   camada de validação.
3. Adicionar schema Yup seguindo o padrão já usado nos outros 27 controllers.

**Esforço:** médio (trabalho repetitivo, mas precisa checar caso a caso).
**Risco:** baixo por controller, mas great número de arquivos.

## 3. `npm audit fix --force` (mudanças quebradoras)

**Backend** — 23 vulnerabilidades, todas exigindo major upgrade:
- `uuid`/`bull`/`sequelize`/`sequelize-typescript`/`exceljs`: upgrades majors
  encadeados. Precisa rodar a suíte completa de testes de integração após
  cada upgrade (o projeto já tem suíte boa para isso).
- `request`/`instagram-private-api` (SSRF, **sem fix disponível**): a lib é
  não-oficial (o próprio README já avisa sobre isso). Opções: (a) aceitar o
  risco documentado, (b) avaliar troca por outra lib de Instagram DM, ou (c)
  isolar essa integração em um processo/rede restrita.
- `@sentry/node` → v10: upgrade grande, checar breaking changes na API de
  inicialização usada em `src/app/modules.ts`.

**Frontend** — 5 vulnerabilidades, todas por `@quasar/app-webpack` → 4.3.2:
- Upgrade de major do toolchain de build. Testar build completo e os specs
  Playwright depois.

**Como abordar:** fazer um upgrade por vez, em branch isolada, rodando lint +
build + suíte de testes completa a cada passo. Não fazer em lote.

**Esforço:** médio a grande. **Risco:** médio-alto (upgrades majors podem
mudar comportamento).

## 4. Cobertura de testes para módulos grandes sem teste

**Módulos sem cobertura aparente e de alto risco de negócio:**
`ServiceOrderService.ts` (4538 linhas — agendamento, estoque, PDF, garantias),
`SalesPipelineService.ts` (1307 linhas), `MonitoringService.ts` (1009 linhas),
`WabaMetaOAuthController`.

**Por que não foi feito agora:** escrever testes significativos para um
serviço de 4538 linhas exige entender toda a lógica de negócio primeiro —
não é seguro gerar testes superficiais só para "bater cobertura"; testes
ruins dão falsa confiança.

**Como abordar:**
1. Antes de testar, considerar já quebrar o arquivo em módulos menores
   (ver item 5) — fica mais fácil testar unidades pequenas e focadas.
2. Priorizar por risco de negócio: baixa automática de estoque e cálculo de
   totais financeiros primeiro (já que envolvem dinheiro/inventário real).
3. Usar as factories/mocks já existentes em `backend/tests/factories` e
   `backend/tests/mocks` como base.
4. Confirmar se o threshold de 80%/90% do `jest.config.js` está realmente
   sendo checado no CI hoje ou se está sendo contornado — se estiver sendo
   contornado, isso por si só já é algo a corrigir primeiro.

**Esforço:** grande (múltiplos dias). **Risco:** baixo (só adiciona testes),
mas é o item de maior esforço da lista.

## 5. Quebrar os arquivos "god file"

**Backend:** `ServiceOrderService.ts` (4538 linhas), `ServiceOrderController.ts`
(1394), `SalesPipelineService.ts` (1307), `MonitoringService.ts` (1009).
**Frontend:** `ordensServico/Index.vue` (3594 linhas!), `atendimento/Index.vue`
(1315), `MainLayout.vue` (1272), `monitoramento/Index.vue` (998).

**Por que não foi feito agora:** é refatoração estrutural em código que roda
em produção e mexe com estoque/financeiro/agenda. Sem testes de cobertura
prévios (ver item 4), dividir esses arquivos é arriscado — fácil introduzir
uma regressão sutil sem perceber.

**Como abordar:**
1. **Fazer depois de reforçar a cobertura de testes do item 4**, não antes —
   testes dão a rede de segurança para refatorar com confiança.
2. Extrair por responsabilidade (ex.: em `ServiceOrderService.ts`, separar
   agendamento / baixa de estoque / geração de PDF / recorrência em módulos
   próprios), mantendo a interface pública do service estável.
3. No frontend, extrair sub-componentes de `ordensServico/Index.vue` por
   seção de UI (agenda, formulário de OS, listagem), um de cada vez,
   validando manualmente no navegador a cada extração.

**Esforço:** grande. **Risco:** médio-alto sem testes prévios, baixo-médio com
testes prévios.

## 6. Reduzir uso de `LegacyAny` (478 ocorrências)

**Por quê:** `type LegacyAny = any` em `src/@types/global.d.ts:19` é um
escape-hatch usado em massa que anula boa parte da checagem de tipos do
TypeScript, inclusive em `req.user`, payloads de fila e eventos Bull.

**Como abordar:**
1. Não tentar eliminar tudo de uma vez — é invasivo demais para um projeto
   deste tamanho.
2. Priorizar por superfície de risco: tipos de payload de fila (Bull/RabbitMQ)
   e `req.user`/contexto de autenticação primeiro, já que erros ali têm maior
   potencial de causar bug de segurança ou dado trocado entre tenants.
3. Tratar como um item contínuo (ex.: "todo PR que tocar um arquivo com
   `LegacyAny` na área alterada troca por um tipo real"), não uma tarefa
   isolada.

**Esforço:** grande, mas divisível em pedaços pequenos e contínuos.
**Risco:** baixo (é só tipagem, não muda comportamento em runtime).

## 7. Dockerfile: usuário não-root na imagem de produção

**Por quê:** o `production-stage` roda como root e ainda carrega o toolchain
de build completo (`g++`, `make`, `python3`, `nano`) herdado do
`global-deps-stage`.

**Por que não foi feito agora:** os volumes montados em `docker-compose.yml`
(`.data/.wwebjs_auth`, `.data/medias`) hoje são gravados como root. Trocar
para um usuário não-root sem ajustar a posse (`chown`) desses diretórios no
host quebraria a persistência de sessão do WhatsApp e upload de mídia no
próximo deploy — é uma mudança que precisa de um passo de migração
coordenado, não só uma linha `USER` no Dockerfile.

**Como abordar:**
1. Definir um `USER` dedicado (uid/gid fixos) na imagem.
2. No deploy, rodar um passo único de `chown -R` nos diretórios persistentes
   existentes (`.data/.wwebjs_auth`, `.data/medias` ou o equivalente em
   `PERSISTENT_DATA_DIR`) antes de trocar a imagem em produção.
3. Separadamente, avaliar mover a instalação do Chrome/fontes para um estágio
   próprio que não carregue `g++`/`make`/`python3` na imagem final (essas só
   são necessárias para compilar dependências nativas durante o `npm ci`, não
   em runtime).

**Esforço:** pequeno (código) + coordenação de deploy (não-código).
**Risco:** alto se feito sem o passo de `chown` — pode quebrar sessões de
WhatsApp e uploads existentes em produção.

## 8. Limpeza de código morto e `console.log`

Itens de baixo risco, mas espalhados — bom para preencher tempo entre outras
tarefas, não urgente:
- Stubs de Messenger em `WebHooksController.ts:135-160`.
- Métodos comentados em `rabbitmq-server.ts` (`createExchange`).
- Checagem de admin comentada em `UserController.ts:129-131`.
- Feature de idle-timeout morta em `App.vue` (usa `alert()`).
- ~64 `console.log`/`console.error` no backend (concentrados em `AMI.ts`,
  `QueueListeners.ts`) e 85 no frontend, deveriam usar o logger estruturado
  (`utils/logger.ts` no backend).

## 9. Outros itens de menor prioridade, sem plano detalhado

- `jsplumb.js` vendorizado (15713 linhas) no frontend: avaliar se dá para
  voltar a ser dependência normal de `node_modules` em vez de código-fonte
  commitado.
- `sanitizeHtml.js` customizado para os 4 usos de `v-html`: funcional hoje,
  mas reavaliar troca por uma lib madura (DOMPurify) se o volume de conteúdo
  de terceiros (mensagens recebidas) crescer.

---

**Resumo de ordem recomendada:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8/9 (paralelo).
Os itens 4 e 5 são os que mais se beneficiam de serem tratados juntos, nessa
ordem (testes antes de refatorar).
