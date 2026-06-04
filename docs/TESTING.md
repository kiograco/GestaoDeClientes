# Testes

Este projeto usa Jest/Supertest no backend Node.js/TypeScript e Playwright no frontend Vue/Quasar.

## Estrutura

- `backend/tests/unit`: services, helpers e regras de negocio sem banco.
- `backend/tests/integration`: endpoints REST com banco PostgreSQL de teste.
- `backend/tests/fixtures`: payloads reutilizaveis.
- `backend/tests/factories`: criacao de empresa, usuarios, clientes, tickets, catalogo, pedidos, enderecos, planos e assinaturas.
- `backend/tests/mocks`: gateway de pagamento, email, WhatsApp/API externa, chatbot, upload e frete.
- `backend/tests/helpers`: app Express, auth JWT, limpeza de banco e regras auxiliares.
- `frontend/tests/e2e`: fluxos criticos automatizados com Playwright.

## Banco de teste

Use sempre um banco separado. Para criar e migrar o banco local padrao:

```bash
npm --prefix backend run test:db:prepare
```

Variaveis recomendadas:

```bash
NODE_ENV=test
POSTGRES_HOST=localhost
POSTGRES_DB=wchats_test
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DB_PORT=5432
JWT_SECRET=test-jwt-secret
JWT_REFRESH_SECRET=test-refresh-secret
```

## Execucao local

```bash
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix backend run test:migrate
npm run test:unit
npm run test:integration
npm --prefix frontend run test:e2e
npm run test:coverage
```

Para instalar browsers do Playwright:

```bash
npm --prefix frontend exec playwright install chromium
```

## Cobertura

O Jest exige 80% global e 90% em regras criticas de pedidos, assinatura/acesso e autenticacao multiempresa. O relatorio fica em `backend/coverage`.

## Boas praticas

Nao use dados reais. Cada teste deve criar seus proprios dados via factories e a suite de integracao limpa o banco apos cada caso. Mocks devem substituir gateway de pagamento, email, WhatsApp, chatbot, upload e frete.
