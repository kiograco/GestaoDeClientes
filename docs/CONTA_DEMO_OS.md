# Conta demo de ordens de serviço

Este projeto possui um seed opcional para criar uma empresa demo isolada para
exibição e testes da agenda de ordens de serviço.

## Dados de acesso

```text
E-mail: demo@ncprogrammers.local
Senha: 123456
Empresa: Empresa Demo OS
```

Use somente em ambiente local, homologação ou demonstração. Não use essa conta
em produção pública.

## Criar os dados

Com o backend compilado e o PostgreSQL ativo:

```sh
npm --prefix backend run build
npm --prefix backend run db:seed:demo
```

O seed cria dados fake e idempotentes:

- empresa demo com acesso ativo até 2099;
- usuário administrador demo;
- canal WhatsApp demo desconectado;
- clientes com perfil comercial e endereço;
- técnicos ativos;
- ordens de serviço distribuídas na agenda do próximo dia útil.

Se estiver executando fora do container e o `.env` usa `POSTGRES_HOST=postgres`,
rode o comando com `POSTGRES_HOST=localhost` quando o PostgreSQL estiver
exposto localmente.

## Railway

No Railway, o deploy executa migrations automaticamente, mas não executa seeds
por padrão. Para criar a conta demo no banco do Railway, defina a variável abaixo
no serviço do backend e faça um redeploy:

```text
ENABLE_DEMO_SERVICE_ORDER_SEED=true
```

O seed é idempotente para a conta `demo@ncprogrammers.local`, então pode rodar
mais de uma vez sem duplicar a empresa demo.

Depois que a conta aparecer, remova ou altere a variável para evitar manter seed
demo habilitado em ambiente público:

```text
ENABLE_DEMO_SERVICE_ORDER_SEED=false
```

Também é possível rodar manualmente pelo shell do serviço backend no Railway:

```sh
npm run db:seed:demo
```
